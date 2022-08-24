import json
import os
from datetime import datetime, timedelta

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
    file_path = 'data/issues.json'
    if ctx == 'issues':
        with open(file_path, 'w+') as writer:
            if(len(str_data) > 1):
                writer.writelines(str_data[0])
            else:
                writer.writelines(str_data)
            writer.close()

        f = open(file_path)
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

    if os.path.isfile(file_path):
        os.remove(file_path)    
    return data


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


def metrics(owner, repo):

    github_dict = []
    for commit in commit_repo(owner, repo):
        date = format_commit_date(commit['data']['CommitDate'])

        if "Merge pull request" not in commit['data']['message']:
            author = commit['data']['Author'].split(' <')[0]
            identifier = parse_commit_identifier(commit['data']['Author'])
            
            if not '[bot]' in author and not 'gavelino' in identifier:
                count_files = []

                for files in commit['data']['files']:
                    if('.md' in files['file']):
                        count_files.append(identifier)

                github_dict.append({
                    'date': date,
                    'identifier': identifier,
                    'author': commit['data']['Author'].split(' <')[0],
                    'docs': True if len(count_files) > 0 else False
                })

    result = {'metrics': github_dict}
    return json.dumps(result)


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

    result = {'commits': commits_list}
    return json.dumps(result)


def get_issues(owner, repo):
    repo = GitHubClient(owner=owner, repository=repo,
                        tokens=[os.environ['token']])
    issues_response, issues_list = ([] for i in range(2))

    for item in repo.issues():
        issues_response.append(item)

    data = str_to_json(issues_response, 'issues')

    for elem in data:
        if not 'pull_request' in elem:
            created = parse_date(elem['created_at'])
            if elem['closed_at']:
                closed = parse_date(elem['closed_at'])
                difference = difference_between_dates(created, closed)
            else:
                closed, difference = (None for i in range(2))
            labels = parse_arrays(elem['labels'], 'name')
            assignees = parse_arrays(elem['assignees'], 'login')

            info = {
                'id': elem['number'],
                "number": f"#{elem['number']}",
                'title': elem['title'],
                'creator': elem['user']['login'],
                'state': elem['state'],
                'labels': labels,
                'assignees': assignees,
                'comments': elem['comments'],
                'created_at': created,
                'closed_at': closed,
                "active_days": difference,
                'url': elem['html_url'],
            }

            issues_list.append(info)

    result = {'issues': sorted(issues_list, key=lambda d: d['id'])}
    return json.dumps(result)


def get_pull_requests(owner, repo):
    repo = GitHub(owner=owner, repository=repo,
                  api_token=[os.environ['token']])

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

    # begin = datetime_to_utc(datetime.strptime(date['begin'], '%Y-%m-%d'))
    # end = datetime_to_utc(datetime.strptime(
    #     date['end'], '%Y-%m-%d') + timedelta(days=1))
    begin = datetime_to_utc(datetime.strptime('2021-06-21', '%Y-%m-%d'))
    end = datetime_to_utc(datetime.strptime(
        '2021-06-25', '%Y-%m-%d') + timedelta(days=1))

    for item in repo.fetch_items(category='pull_request', from_date=begin, to_date=end):
        created = parse_date(item['created_at'])
        closed = parse_date(item['closed_at'])
        merged = parse_date(
            item['merged_at']) if item['merged_at'] == True else None

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
            'created': created,
            'closed': closed,
            'merged': merged,
            "active_days": difference,
            'was_merged': item['merged'],
            'merged_by': item['merged_by']['login'] if item['merged_by'] else None,
            'comments': item['comments'] + item['review_comments'] + count_comments,
            'comments_authors': authors_dict[pr_number]
        }

        pr_list.append(info)

    result['pr'] = sorted(pr_list, key=lambda d: d['number'])
    return json.dumps(result)


def issues_dates(owner, repo):
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

    result = {'issues': sorted(
        creation_list + closing_list, key=lambda d: d['date'])}
    return json.dumps(result)
