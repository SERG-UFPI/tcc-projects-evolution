import json
import os
from datetime import datetime, timedelta, date

import github
import requests
from grimoirelab_toolkit.datetime import datetime_to_utc

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

    result.sort()
    return result


def format_commit_date(date):
    clear_date = datetime.strptime(date, '%c %z')

    return str(clear_date).split(' ')[0].replace('-', '')


def commit_repo(owner, repo, branches_list=None):
    repo_url = f'http://github.com/{owner}/{repo}.git'
    repo_dir = f'/tmp/{repo}.git'
    repo = Git(uri=repo_url, gitpath=repo_dir)

    return repo.fetch(branches=branches_list)


def parse_commit_identifier(commit_info):
    identifier = commit_info.split(' <')[1].split('>')[0]
    if('+' in identifier):
        identifier = identifier.split('+')[1].split('@')[0]

    return identifier


def parse_first_last_date_issue(createds, closes):
    createds.sort()
    closes.sort()

    first = createds[0].split('T')[0]
    last = closes[-1].split('T')[0]

    result = {'begin': first, 'end': last}
    return result


def parse_date(date):
    return date.split('T')[0].replace('-', '')


def difference_between_dates(date1, date2):
    if len(date1) == 8 and len(date2) == 8:
        date1 = date1[0:4] + '-' + date1[4:6] + '-' + date1[6:8]
        date2 = date2[0:4] + '-' + date2[4:6] + '-' + date2[6:8]

    d1 = datetime.strptime(date1, "%Y-%m-%d")
    d2 = datetime.strptime(date2, "%Y-%m-%d")

    delta = d2 - d1
    return delta.days


def get_commits(owner, repo):
    commits_list = []
    last_commit_hash = ''

    for commit in commit_repo(owner, repo):
        message = commit['data']['message']
        identifier = parse_commit_identifier(commit['data']['Author'])

        if ("Merge pull request" not in message and "Merge branch" not in message and "Merge remote" not in message) and "gavelino" not in identifier:
            added = 0
            removed = 0
            count_files = []

            for files in commit['data']['files']:
                total_added = files.get('added')
                total_removed = files.get('removed')
                if('.md' in files['file']):
                    count_files.append(identifier)

                if(total_added and total_removed):
                    if(not total_added == '-' and not total_removed == '-'):
                        added += int(total_added)
                        removed += int(total_removed)

            author = commit['data']['Author'].split(' <')[0]
            commit_hash = commit['data']['commit']
            if(not '[bot]' in author and last_commit_hash != commit_hash):
                info = {
                    'hash': commit_hash,
                    'date': format_commit_date(commit['data']['CommitDate']),
                    'author': author,
                    'identifier': identifier,
                    'message': message,
                    'lines_added': added,
                    'lines_removed': removed,
                    'files_changed': commit['data']['files'],
                    'docs': True if len(count_files) > 0 else False,
                    'url': f"https://github.com/{owner}/{repo}/commit/{commit_hash}"
                }

                last_commit_hash = commit_hash
                commits_list.append(info)

    result = {'commits': commits_list}
    return json.dumps(result)


def branches_commits(owner, repo):
    g = github.Github()
    repo_info = g.get_repo(f"{owner}/{repo}")

    branches_dict = {}
    for i in repo_info.get_branches():
        if 'bot' not in str(i):
            branches_dict[str(i)[13:-2]] = []

    last_commit_hash = ''
    for branch, commits_list in branches_dict.items():
        for commit in commit_repo(owner, repo, [branch]):
            message = commit['data']['message']
            commit_hash = commit['data']['commit']
            identifier = commit['data']['Author']
            commit_hash = commit['data']['commit']
            author = commit['data']['Author'].split(' <')[0]

            if (("Merge pull request" not in message and "Merge branch" not in message) and
                    ("Merge remote" not in message and "gavelino" not in identifier) and
                    (not '[bot]' in author and last_commit_hash != commit_hash)):
                commits_list.append(commit_hash)
                last_commit_hash = commit_hash

    result = {'branches': branches_dict}
    return json.dumps(result)


def user_commits(owner, repo):
    users_dict = {}
    count = 0
    page = 1
    control = [0]

    while count == 0 or count >= 100:
        response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=100&page={page}")

        data = response.json()

        if(data):
            for item in data:
                user = item['author']['login']
                commit_author = item['commit']['author']['name']
                if user not in users_dict:
                    users_dict[user] = [commit_author]
                else:
                    if commit_author not in users_dict[user]:
                        users_dict[user].append(commit_author)

                count += 1

        if(control[-1] == count):
            break

        page += 1
        control.append(count)

    result = {'users': users_dict}
    return json.dumps(result)


def get_issues(owner, repo):
    repo = GitHub(owner=owner, repository=repo,
                  api_token=[os.environ['token']])
    issues_list = []
    authors_dict = {}

    for item in repo.fetch():
        if 'pull_request' in item['data']:
            pass
        else:
            issue_number = item['data']['number']
            authors_dict[issue_number] = {}

            created = parse_date(item['data']['created_at'])
            labels = parse_arrays(item['data']['labels'], 'name')
            assignees = parse_arrays(item['data']['assignees'], 'login')

            if item['data']['closed_at']:
                closed = parse_date(item['data']['closed_at'])
                difference = difference_between_dates(created, closed)
            else:
                closed, difference = (None for i in range(2))

            if item['data']['comments'] > 0:
                for user in item['data']['comments_data']:
                    login_github = user['user']['login']
                    if login_github not in authors_dict.keys():
                        authors_dict[issue_number][login_github] = 1
                    else:
                        authors_dict[issue_number][login_github] += 1

            info = {
                'id': issue_number,
                "number": f"#{issue_number}",
                'title': item['data']['title'],
                'creator': item['data']['user']['login'],
                'state': item['data']['state'],
                'labels': labels,
                'assignees': assignees,
                'comments': item['data']['comments'],
                'comments_authors': authors_dict[issue_number],
                'created_at': created,
                'closed_at': closed,
                "active_days": difference,
                'url': item['data']['html_url'],
            }

            issues_list.append(info)

    result = {'issues': sorted(issues_list, key=lambda d: d['id'])}
    return json.dumps(result)


def issues(owner, repo):
    data = json.loads(get_issues(owner, repo))
    creation_dates, closing_dates, creation_list, closing_list = (
        [] for i in range(4))

    for issue in data['issues']:
        creation_dates.append(issue['created_at'])
        if issue['closed_at'] is not None:
            closing_dates.append(issue['closed_at'])

    creation_clear = remove_duplicates(creation_dates)
    closing_clear = remove_duplicates(closing_dates)

    creation_list = [{
        "date": date, "total_created": creation_dates.count(date),
        "total_closed": 0
    } for date in creation_clear]

    for closed in closing_clear:
        for elem in creation_list:
            if closed == elem['date']:
                elem['total_closed'] = closing_dates.count(closed)
                closing_clear.pop(closing_clear.index(closed))

    closing_list = [{
        "date": date,
        "total_created": 0,
        "total_closed": closing_dates.count(date)
    } for date in closing_clear]

    result = {
        'dates': sorted(creation_list + closing_list, key=lambda d: d['date']),
        'issues': data['issues'],
    }
    return json.dumps(result)


def get_pull_requests(owner, repo):
    repo = GitHub(owner=owner, repository=repo,
                  api_token=[os.environ['token']])

    pr_list, created_list, closed_list = ([] for i in range(3))
    authors_dict, pr_title_dict, date_dict, result = ({} for i in range(4))

    for item in repo.fetch():
        if not 'pull_request' in item['data']:
            created_list.append(item['data']['created_at'])
            if item['data']['closed_at']:
                closed_list.append(item['data']['closed_at'])
        else:
            pr_title_dict[item['data']['number']] = item['data']['title']
            number = str(item['data']['number'])
            authors_dict[number] = {}

            for comments in item['data']['comments_data']:
                reviewer = comments['user']['login']

                if reviewer not in authors_dict.keys():
                    authors_dict[number][reviewer] = 1
                else:
                    authors_dict[number][reviewer] += 1

    if closed_list:
        date_dict = parse_first_last_date_issue(created_list, closed_list)
    else:
        created_list.sort()
        date_dict['begin'] = created_list[0].split('T')[0]
        date_dict['end'] = str(date.today())

    begin = datetime_to_utc(datetime.strptime(date_dict['begin'], '%Y-%m-%d'))
    end = datetime_to_utc(datetime.strptime(
        date_dict['end'], '%Y-%m-%d') + timedelta(days=1))

    default_branch = ''
    for item in repo.fetch_items(category='pull_request', from_date=begin, to_date=end):
        created = parse_date(item['created_at'])
        if item['closed_at']:
            closed = parse_date(item['closed_at'])
            difference = difference_between_dates(created, closed)
        else:
            difference = None
        if item['merged_at']:
            merged = parse_date(item['merged_at'])
        else:
            merged = None

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
            'id': item['number'],
            'number': f"#{item['number']}",
            'title': pr_title_dict[item['number']],
            'creator': item['user']['login'],
            'reviewers': requested_reviewers,
            'created': created,
            'closed': closed,
            'merged': merged,
            "active_days": difference,
            'was_merged': item['merged'],
            'merged_by': item['merged_by']['login'] if item['merged_by'] else None,
            'comments': item['comments'] + item['review_comments'] + count_comments,
            'comments_authors': authors_dict[pr_number],
            'url': item['html_url']
        }
        default_branch = item['head']['repo']['default_branch']
        pr_list.append(info)

    result['pr'] = sorted(pr_list, key=lambda d: d['number'])
    result['default'] = default_branch
    return json.dumps(result)
