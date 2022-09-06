from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from waitress import serve

from service import (branches_commits, get_commits, get_pull_requests, issues,
                     user_commits)

app = Flask(__name__)
CORS(app, supports_credentials=True)
load_dotenv()


@app.route('/')
def home():
    return "<h1>Projeto TCC & Eng 2!!!</h1>"


@app.route('/info/issues/<owner>/<repo>')
def show_issues(owner, repo):
    result = issues(owner, repo)

    return result


@app.route('/info/pr/<owner>/<repo>')
def show_pr(owner, repo):
    result = get_pull_requests(owner, repo)

    return result


@app.route('/info/commits/<owner>/<repo>')
def show_total_commits(owner, repo):
    result = get_commits(owner, repo)

    return result


@app.route('/info/branches/<owner>/<repo>')
def show_branches(owner, repo):
    result = branches_commits(owner, repo)

    return result


@app.route('/info/users/<owner>/<repo>')
def show_users(owner, repo):
    result = user_commits(owner, repo)

    return result


if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=50, threads=6)
