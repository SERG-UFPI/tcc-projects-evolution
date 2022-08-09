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

    result.sort()
    return result


def formatCommitDate(date):
    clear_date = datetime.strptime(date, '%c %z')

    return str(clear_date).split(' ')[0].replace('-', '')


def get_commits(owner, repo):
    repo_url = f'http://github.com/{owner}/{repo}.git'
    repo_dir = f'/tmp/{repo}.git'
    repo = Git(uri=repo_url, gitpath=repo_dir)
    commits_list = []
    last_commit_hash = ''

    for commit in repo.fetch():
        commit_hash = commit['data']['commit']
        date = formatCommitDate(commit['data']['CommitDate'])
        author = commit['data']['Author'].split(' <')[0]
        identifier = commit['data']['Author'].split(' <')[1].split('.')[0]
        message = commit['data']['message']
        added = 0
        removed = 0

        for files in commit['data']['files']:
            total_added = files.get('added')
            total_removed = files.get('removed')

            if(total_added and total_removed):
                if(not total_added == '-' and not total_removed == '-'):
                    added += int(total_added)
                    removed += int(total_removed)

        if('+' in identifier):
            aux = identifier.split('+')[1].split('@')[0]
            identifier = aux

        if(not '[bot]' in author and last_commit_hash != commit_hash):
            info = {
                'date': date,
                'author': author,
                'identifier': identifier,
                'message': message,
                'files_changed': len(commit['data']['files']),
                'lines_added': added,
                'lines_removed': removed
            }
            last_commit_hash = commit_hash
            commits_list.append(info)
        # commits_list.append(commit['data'])

    result = {}
    result['commits'] = commits_list

    return json.dumps(result)


def get_issues(owner, repo):
    parsed_token = os.environ['token']
    token = [parsed_token]
    repo = GitHub(owner=owner, repository=repo, api_token=token)

    issues_list = []
    for item in repo.fetch():
        if 'pull_request' in item['data']:
            pass
        else:
            labels = parse_arrays(item['data']['labels'], 'name')
            assignees = parse_arrays(item['data']['assignees'], 'login')

            info = {'number': item['data']['number'],
                    'creator': item['data']['user']['login'],
                    'state': item['data']['state'],
                    'labels': labels,
                    'assignees': assignees,
                    'comments': item['data']['comments'],
                    'created_at': item['data']['created_at'],
                    'closed_at': item['data']['closed_at']
                    }
            issues_list.append(info)
            # issues_list.append(item['data'])

    result = {}
    result['issues'] = issues_list
    return json.dumps(result)


def issues_dates(owner, repo):
    data = json.loads(get_issues(owner, repo))
    creation_dates, closing_dates, creation_list, closing_list = (
        [] for i in range(4))

    for issue in data['issues']:
        creation_dates.append(issue['created_at'].split('T')[
                              0].replace('-', ''))
        if issue['closed_at'] is not None:
            closing_dates.append(issue['closed_at'].split('T')[
                                 0].replace('-', ''))

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
            created = issue['created_at'].split('T')
            closed = issue['closed_at'].split('T')

            date = issue['closed_at'].split('T')[0].replace('-', '')
            difference = difference_between_dates(created[0], closed[0])

            total_issues += 1
            issues.append(
                {"number": issue['number'], "author": issue['creator'],
                 "created": created[0].replace('-', ''),
                 "closed": date, "active_days": difference})

    result = {}
    result['issues'] = issues

    return json.dumps(result)
