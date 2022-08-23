import json
import os
import time
from datetime import datetime, timedelta
from github import Github

from grimoirelab_toolkit.datetime import datetime_to_utc

from perceval_repo.perceval.backends.core.git import Git
from perceval_repo.perceval.backends.core.github import GitHub, GitHubClient


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

    result.sort()
    return result


def format_commit_date(date):
    clear_date = datetime.strptime(date, '%c %z')

    return str(clear_date).split(' ')[0].replace('-', '')


def commit_repo(owner, repo):
    repo_url = f'http://github.com/{owner}/{repo}.git'
    repo_dir = f'/tmp/{repo}.git'
    repo = Git(uri=repo_url, gitpath=repo_dir)

    return repo.fetch()


def parse_commit_identifier(commit_info):
    identifier = commit_info.split(' <')[1].split('>')[0]
    if('+' in identifier):
        identifier = identifier.split('+')[1].split('@')[0]

    return identifier


def str_to_json(str_data, ctx):
    if ctx == 'issues':
        with open('data/issues.json', 'w+') as writer:
            if(len(str_data) > 1):
                writer.writelines(str_data[0])
            else:
                writer.writelines(str_data)
            writer.close()

        f = open('data/issues.json')
    elif ctx == 'pr':
        with open('data/pr.json', 'w+') as writer:
            writer.writelines('[')
            for i in range(len(str_data)):
                writer.writelines(str_data[i])
                if not (i == len(str_data)-1):
                    writer.writelines(',')
            writer.writelines(']')
            writer.close()

        f = open('data/pr.json')

    data = json.load(f)
    f.close()

    return data


def get_commits(owner, repo):
    commits_list = []
    last_commit_hash = ''

    for commit in commit_repo(owner, repo):
        added = 0
        removed = 0

        for files in commit['data']['files']:
            total_added = files.get('added')
            total_removed = files.get('removed')

            if(total_added and total_removed):
                if(not total_added == '-' and not total_removed == '-'):
                    added += int(total_added)
                    removed += int(total_removed)

        author = commit['data']['Author'].split(' <')[0]
        commit_hash = commit['data']['commit']
        if(not '[bot]' in author and last_commit_hash != commit_hash):
            info = {
                'date': format_commit_date(commit['data']['CommitDate']),
                'author': author,
                'identifier': parse_commit_identifier(commit['data']['Author']),
                'message': commit['data']['message'],
                'lines_added': added,
                'lines_removed': removed,
                'files_changed': commit['data']['files']
            }

            last_commit_hash = commit_hash
            commits_list.append(info)

    result = {}
    result['commits'] = commits_list

    return json.dumps(result)


g = Github(login_or_token=os.environ['token'])


def check_author_commit(commit, contributors, new_info):
    check = []
    for el in g.search_users(commit['identifier'], order='asc'):
        check.append(el)

    if len(check) == 0:
        try:
            for el in g.search_users(commit['author'], order='desc'):
                parsed_name = str(el)[17:-2]
                if parsed_name in contributors:
                    if parsed_name not in new_info:
                        new_info[parsed_name] = {
                            'total': commit['total'], 'total_docs': commit['total_docs']}
                    else:
                        new_info[parsed_name]['total'] += commit['total']
                        new_info[parsed_name]['total_docs'] += commit['total_docs']
                    return True
        except:
            return False
    else:
        for el in g.search_users(commit['identifier'], order='asc'):
            parsed_name = str(el)[17:-2]
            if parsed_name in contributors:
                if parsed_name not in new_info:
                    new_info[parsed_name] = {
                        'total': commit['total'], 'total_docs': commit['total_docs']}
                else:
                    new_info[parsed_name]['total'] += commit['total']
                    new_info[parsed_name]['total_docs'] += commit['total_docs']
                return True


def metrics(owner, repo):
    count_files = []
    authors_dict, result = ({} for i in range(2))
    repo_py = g.get_repo(f'{owner}/{repo}')
    contributors = []
    new_info = {}

    for el in repo_py.get_contributors():
        contributors.append(str(el)[17:-2])

    for commit in commit_repo(owner, repo):
        identifier = parse_commit_identifier(commit['data']['Author'])

        if identifier not in authors_dict.keys():
            authors_dict[identifier] = {'author': commit['data']['Author'].split(' <')[
                0], 'total': 1, 'total_docs': 0}
        else:
            authors_dict[identifier]['total'] += 1

        for files in commit['data']['files']:
            if('.md' in files['file']):
                count_files.append(identifier)

    non_repeat_identifier = remove_duplicates(count_files)
    for elem in non_repeat_identifier:
        authors_dict[elem]['total_docs'] = count_files.count(elem)

    result_list = [{
        'identifier': elem,
        'author': authors_dict[elem]['author'],
        'total': authors_dict[elem]['total'],
        'total_docs': authors_dict[elem]['total_docs']
    } for elem in authors_dict if(not '[bot]' in elem and not 'gavelino' in elem)]

    for commit in result_list:
        if(check_author_commit(commit, contributors, new_info)):
            print(
                f"{commit['author']} ~ {commit['identifier']} faz parte do projeto")
            commit['check'] = True
        else:
            commit['check'] = False

    result = {}
    final1 = []
    final2 = []
    for commit in result_list:
        if not commit['check']:
            new_info[commit['identifier']] = {
                'total': commit['total'], 'total_docs': commit['total_docs']}

    for i in new_info:
        final1.append(i)
        final2.append(new_info[i])

    final3 = [final1, final2]
    result['metrics'] = final3

    return json.dumps(result)


def get_issues(owner, repo):
    parsed_token = os.environ['token']
    token = [parsed_token]
    repo = GitHubClient(owner=owner, repository=repo, tokens=token)
    issues_response, issues_list, pr_list = ([] for i in range(3))

    for item in repo.issues():
        issues_response.append(item)

    data = str_to_json(issues_response, 'issues')

    for elem in data:
        if 'pull_request' in elem:
            pr_list.append(elem)
        else:
            labels = parse_arrays(elem['labels'], 'name')
            assignees = parse_arrays(elem['assignees'], 'login')

            info = {'number': elem['number'],
                    'title': elem['title'],
                    'creator': elem['user']['login'],
                    'state': elem['state'],
                    'labels': labels,
                    'assignees': assignees,
                    'comments': elem['comments'],
                    'created_at': elem['created_at'],
                    'closed_at': elem['closed_at'],
                    'url': elem['html_url'],
                    }

            issues_list.append(info)

    result = {
        'issues': sorted(issues_list, key=lambda d: d['number']),
        'pr': sorted(pr_list, key=lambda d: d['number'])
    }
    return json.dumps(result)


def parse_first_last_date_issue(createds, closes):
    createds.sort()
    closes.sort()

    first = createds[0].split('T')[0]
    last = closes[-1].split('T')[0]

    result = {'begin': first, 'end': last}
    return result


def get_pull_requests(owner, repo):
    parsed_token = os.environ['token']
    token = [parsed_token]
    repo = GitHub(owner=owner, repository=repo, api_token=token)

    pr_list, created_list, closed_list = ([] for i in range(3))
    authors_dict, result = ({} for i in range(2))
    for item in repo.fetch():
        if not 'pull_request' in item['data']:
            created_list.append(item['data']['created_at'])
            if item['data']['closed_at']:
                closed_list.append(item['data']['closed_at'])
        else:
            number = str(item['data']['number'])
            authors_dict[number] = {}

            for comments in item['data']['comments_data']:
                reviewer = comments['user']['login']

                if reviewer not in authors_dict.keys():
                    authors_dict[number][reviewer] = 1
                else:
                    authors_dict[number][reviewer] += 1

    date = parse_first_last_date_issue(created_list, closed_list)

    begin = datetime_to_utc(datetime.strptime(date['begin'], '%Y-%m-%d'))
    end = datetime_to_utc(datetime.strptime(
        date['end'], '%Y-%m-%d') + timedelta(days=1))
    """ begin = datetime_to_utc(datetime.strptime('2021-06-21', '%Y-%m-%d'))
    end = datetime_to_utc(datetime.strptime(
        '2021-06-25', '%Y-%m-%d') + timedelta(days=1)) """

    for item in repo.fetch_items(category='pull_request', from_date=begin, to_date=end):
        created = item['created_at'].split('T')[0]
        closed = item['closed_at'].split('T')[0]
        if item['merged_at']:
            merged = item['merged_at'].split('T')[0].replace('-', '')
        else:
            merged = None

        difference = difference_between_dates(created, closed)
        requested_reviewers = parse_arrays(
            item['requested_reviewers'], 'login')
        reviewers_obj = parse_arrays(item['reviews_data'], 'user')
        reviewers_parsed = parse_arrays(reviewers_obj, 'login')

        for elem in reviewers_parsed:
            if elem not in requested_reviewers:
                requested_reviewers.append(elem)

        count_comments = 0
        pr_number = str(item['number'])
        for reviews in item['reviews_data']:
            reviewer = reviews['user']['login']
            if(reviews['state'] == 'COMMENTED'):
                count_comments += 1
                if reviewer not in authors_dict[pr_number].keys():
                    authors_dict[pr_number][reviewer] = 1
                else:
                    authors_dict[pr_number][reviewer] += 1

        info = {
            'number': item['number'],
            'creator': item['user']['login'],
            'reviewers': requested_reviewers,
            'created': created.replace('-', ''),
            'closed': closed.replace('-', ''),
            'merged': merged,
            "active_days": difference,
            'was_merged': item['merged'],
            'merged_by': item['merged_by']['login'] if item['merged_by'] else None,
            'comments': item['comments'] + item['review_comments'] + count_comments,
            'comments_authors': authors_dict[pr_number]
        }

        pr_list.append(info)

    result['pr'] = pr_list
    return json.dumps(result)


def parse_date(date):
    return date.split('T')[0].replace('-', '')


def issues_dates(owner, repo):
    data = json.loads(get_issues(owner, repo))
    creation_dates, closing_dates, creation_list, closing_list = (
        [] for i in range(4))

    for issue in data['issues']:
        creation_dates.append(parse_date(issue['created_at']))
        if issue['closed_at'] is not None:
            closing_dates.append(parse_date(issue['closed_at']))

    creation_clear = remove_duplicates(creation_dates)
    closing_clear = remove_duplicates(closing_dates)

    creation_list = [{"date": date, "total_created": creation_dates.count(
        date), "total_closed": 0} for date in creation_clear]

    for closed in closing_clear:
        for elem in creation_list:
            if closed == elem['date']:
                elem['total_closed'] = closing_dates.count(closed)
                closing_clear.pop(closing_clear.index(closed))

    closing_list = [{"date": date, "total_created": 0,
                     "total_closed": closing_dates.count(date)} for date in closing_clear]

    result = {}
    result['issues'] = sorted(
        creation_list + closing_list, key=lambda d: d['date'])
    return json.dumps(result)


def difference_between_dates(date1, date2):
    if len(date1) == 8 and len(date2) == 8:
        date1 = date1[0:4] + '-' + date1[4:6] + '-' + date1[6:8]
        date2 = date2[0:4] + '-' + date2[4:6] + '-' + date2[6:8]

    d1 = datetime.strptime(date1, "%Y-%m-%d")
    d2 = datetime.strptime(date2, "%Y-%m-%d")

    delta = d2 - d1
    return delta.days


def issues_authors_lifetime(owner, repo):
    data = json.loads(get_issues(owner, repo))
    issues = []
    total_issues = 0

    for issue in data['issues']:
        if(issue['state'] == 'closed'):
            created = parse_date(issue['created_at'])
            closed = parse_date(issue['closed_at'])

            difference = difference_between_dates(created, closed)

            total_issues += 1
            issues.append(
                {
                    "id": issue['number'],
                    "number": f"#{issue['number']}",
                    "title": issue['title'],
                    "issue_url": issue['url'],
                    "author": issue['creator'],
                    # "name": issue['name'],
                    "assignees": issue['assignees'],
                    "comments": issue['comments'],
                    "state": issue['state'],
                    "created": created,
                    "closed": closed,
                    "active_days": difference
                }
            )

    result = {}
    result['issues'] = issues

    return json.dumps(result)
