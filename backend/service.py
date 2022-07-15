import json
import os
from datetime import datetime
from perceval_repo.perceval.backends.core.git import Git
from perceval_repo.perceval.backends.core.github import GitHub


def parse_arrays(arr, key):
    objects = []

    for item in arr:
        objects.append(item[key])

    return objects


def remove_duplicates(arr):
    result = []
    for i in arr:
        if i not in result:
            result.append(i)

    return result


""" def parse_dates(count, dates, issue_type):
    non_repeated_dates = remove_duplicates(dates)
    non_repeated_dates.sort()

    for i in non_repeated_dates:
        count[str(i)] = {"total": dates.count(i), "type": issue_type} """


def parse_dates_same_day(count, dates, issue_type):
    non_repeated_dates = remove_duplicates(dates)
    non_repeated_dates.sort()

    for i in non_repeated_dates:
        if str(i) in count:
            previous_info = count[str(i)]
            count[str(i)] = [previous_info[0], {
                "total": dates.count(i), "type": issue_type}]
        else:
            count[str(i)] = [{"total": dates.count(i), "type": issue_type}]


def formatCommitDate(date):
    clear_date = datetime.strptime(date, '%c %z')

    return str(clear_date).split(' ')[0].replace('-', '')


def get_commits(owner, repo):
    aux = []
    date_commits = []

    repo_url = f'http://github.com/{owner}/{repo}.git'
    repo_dir = f'/tmp/{repo}.git'
    repo = Git(uri=repo_url, gitpath=repo_dir)

    for commit in repo.fetch():
        date = formatCommitDate(commit['data']['CommitDate'])
        date_commits.append(date)

        author = commit['data']['Author'].split(' <')[0]

        added = 0
        removed = 0
        for files in commit['data']['files']:
            if(not files['added'] == '-' and not files['removed'] == '-'):
                added += int(files['added'])
                removed += int(files['removed'])
    
        info = {
            date: {
                'author': author,
                'files_changed': len(commit['data']['files']),
                'lines_added': added,
                'lines_removed': removed
            }
        }
        aux.append(info)

    result = {}
    result['commits'] = aux

    return json.dumps(result)


def count_files_changed(date, key, count):
    if not count.__contains__(date[key]['author']):
        count.update({date[key]['author']: date[key]['files_changed']})
    else:
        files = count.get(date[key]['author'])
        total_files = date[key]['files_changed'] + files
        count.update({date[key]['author']: total_files})


def total_files_changed(dates, authors_files, begin=None, final=None):
    for date in dates:
        for key in date:
            if(begin is None and final is None):
                count_files_changed(date, key, authors_files)
            elif(begin and final is None):
                if key >= begin:
                    count_files_changed(date, key, authors_files)
            elif(begin is None and final):
                if key <= final:
                    count_files_changed(date, key, authors_files)
            else:
                if key >= begin and key <= final:
                    count_files_changed(date, key, authors_files)


def get_total_changes_by_time(owner, repo, begin=None, final=None):
    data = json.loads(get_commits(owner, repo))

    authors_files = {}
    total_files_changed(data['commits'], authors_files, begin, final)

    return authors_files


def get_issues(owner, repo):
    pulls = 0
    aux = []

    parsed_token = os.environ['token']
    token = [parsed_token]
    repo = GitHub(owner=owner, repository=repo, api_token=token)

    for item in repo.fetch():
        if 'pull_request' in item['data']:
            pulls += 1
        else:
            labels = parse_arrays(item['data']['labels'], 'name')
            assignees = parse_arrays(item['data']['assignees'], 'login')

            aux.append({'number': item['data']['number'],
                        'creator': item['data']['user']['login'],
                        'state': item['data']['state'],
                        'labels': labels,
                        'assignees': assignees,
                        'comments': item['data']['comments'],
                        'created_at': item['data']['created_at'],
                        'closed_at': item['data']['closed_at']
                        })

    result = {}
    result['issues'] = aux
    return json.dumps(result)


def filter_issues_by_dates(dates, begin=None, final=None):
    issues_by_dates = {}

    for key in dates:
        if(begin is None and final is None):
            issues_by_dates.update({key: dates[key]})
        elif(begin and final is None):
            if key >= begin:
                issues_by_dates.update({key: dates[key]})
        elif(begin is None and final):
            if key <= final:
                issues_by_dates.update({key: dates[key]})
        else:
            if key >= begin and key <= final:
                issues_by_dates.update({key: dates[key]})

    return issues_by_dates


def issues_dates(owner, repo, begin=None, final=None):
    data = json.loads(get_issues(owner, repo))
    dates_created = []
    dates_closed = []
    count = {}

    for issue in data['issues']:
        dates_created.append(issue['created_at'].split('T')[
                             0].replace('-', ''))
        if issue['closed_at'] is not None:
            dates_closed.append(issue['closed_at'].split('T')[
                                0].replace('-', ''))

    parse_dates_same_day(count, dates_created, "created")
    parse_dates_same_day(count, dates_closed, "closed")

    return filter_issues_by_dates(count, begin, final)


def issues_authors(owner, repo, begin=None, final=None):
    data = json.loads(get_issues(owner, repo))
    creators = []
    count = {}

    for issue in data['issues']:
        date = issue['created_at'].split('T')[
            0].replace('-', '')

        if(begin is None and final is None):
            creators.append(issue['creator'])
        elif(begin and final is None):
            if date >= begin:
                creators.append(issue['creator'])
        elif(begin is None and final):
            if date <= final:
                creators.append(issue['creator'])
        else:
            if date >= begin and date <= final:
                creators.append(issue['creator'])

    non_repeated_creators = remove_duplicates(creators)
    non_repeated_creators.sort()

    for i in non_repeated_creators:
        count[str(i)] = creators.count(i)

    return count


def difference_between_dates(date1, date2):
    d1 = datetime.strptime(date1, "%Y-%m-%d")
    d2 = datetime.strptime(date2, "%Y-%m-%d")

    delta = d2 - d1
    return delta.days


def issues_lifetime(owner, repo, begin=None, final=None):
    data = json.loads(get_issues(owner, repo))
    issues = []
    result = {}
    average = 0
    total_issues = 0

    for issue in data['issues']:
        if(issue['state'] == 'closed'):
            created = issue['created_at'].split('T')
            closed = issue['closed_at'].split('T')

            date = issue['closed_at'].split('T')[0].replace('-', '')
            difference = difference_between_dates(created[0], closed[0])

            if(begin is None and final is None):
                total_issues += 1
                average += difference
                issues.append(
                    {"number": issue['number'], "active_days": difference})
            elif(begin and final is None):
                if date >= begin:
                    total_issues += 1
                    average += difference
                    issues.append(
                        {"number": issue['number'], "active_days": difference})
            elif(begin is None and final):
                if date <= final:
                    total_issues += 1
                    average += difference
                    issues.append(
                        {"number": issue['number'], "active_days": difference})
            else:
                if date >= begin and date <= final:
                    total_issues += 1
                    average += difference
                    issues.append(
                        {"number": issue['number'], "active_days": difference})

    # issues.append({"number": -1, "total_issues": total_issues,
    #               "average": round(average/total_issues)})
    result['issues'] = issues

    return json.dumps(result)


def get_commits_by_date(owner, repo, begin=None, final=None):
    data = json.loads(get_commits(owner, repo))
    authors = []
    count = {}

    for commit in data['commits']:
        for key in commit:
            if(begin is None and final is None):
                authors.append(commit[key]['author'])
            elif(begin and final is None):
                if key >= begin:
                    authors.append(commit[key]['author'])
            elif(begin is None and final):
                if key <= final:
                    authors.append(commit[key]['author'])
            else:
                if key >= begin and key <= final:
                    authors.append(commit[key]['author'])

    non_repeated_authors = remove_duplicates(authors)
    non_repeated_authors.sort()

    for i in non_repeated_authors:
        count[str(i)] = authors.count(i)

    return count
