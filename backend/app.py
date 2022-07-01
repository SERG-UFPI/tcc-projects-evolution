import json
import os
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from waitress import serve
from datetime import datetime
from perceval_repo.perceval.backends.core.github import GitHub
from perceval_repo.perceval.backends.core.git import Git

app = Flask(__name__)
CORS(app)
load_dotenv()


@app.route('/')
def home():
    return "<h1>Projeto TCC & Eng 2</h1>"


@app.route('/info/<owner>/<repo>')
def show(owner, repo):
    result = get_issues(owner, repo)
    return result


@app.route('/info/issues-dates/<owner>/<repo>')
def show_issues(owner, repo):
    start = request.args.get('start')
    end = request.args.get('end')

    if(start == ''):
        start = None
    if(end == ''):
        end = None

    result = issues_dates(owner, repo, start, end)
    return result


@app.route('/info/issues-authors/<owner>/<repo>')
def show_issues_authors(owner, repo):
    result = issues_authors(owner, repo)
    return result


@app.route('/info/commits/<owner>/<repo>')
def show_total_commits(owner, repo):
    result = get_commits(owner, repo)
    return result


@app.route('/info/files-changed/<owner>/<repo>')
def show_total_files_changed(owner, repo):
    start = request.args.get('start')
    end = request.args.get('end')

    result = get_total_changes_by_time(owner, repo, start, end)
    return result


###############################


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

        info = {
            date: {
                'author': author,
                'files_changed': len(commit['data']['files'])
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
            if(begin == None and final == None):
                count_files_changed(date, key, authors_files)
            elif(begin and final == None):
                if key >= begin:
                    count_files_changed(date, key, authors_files)
            elif(begin == None and final):
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
        if(begin == None and final == None):
            issues_by_dates.update({key: dates[key]})
        elif(begin and final == None):
            if key >= begin:
                issues_by_dates.update({key: dates[key]})
        elif(begin == None and final):
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
        dates_closed.append(issue['closed_at'].split('T')[0].replace('-', ''))

    parse_dates_same_day(count, dates_created, "created")
    parse_dates_same_day(count, dates_closed, "closed")

    return filter_issues_by_dates(count, begin, final)


def issues_authors(owner, repo):
    data = json.loads(get_issues(owner, repo))
    creators = []
    count = {}

    for issue in data['issues']:
        creators.append(issue['creator'])

    non_repeated_creators = remove_duplicates(creators)
    non_repeated_creators.sort()

    for i in non_repeated_creators:
        count[str(i)] = creators.count(i)

    return count


if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=80)
