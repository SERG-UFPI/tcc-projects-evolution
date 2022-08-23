from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from waitress import serve

from service import (get_commits, get_issues, get_pull_requests,
                     metrics, issues_authors_lifetime,
                     issues_dates)

app = Flask(__name__)
CORS(app)
load_dotenv()


@app.route('/')
def home():
    return "<h1>Projeto TCC & Eng 2!!!</h1>"


# Informações gerais sobre issues daquele repositório, a chave do objeto ainda não eh a DATA
@app.route('/info/<owner>/<repo>')
def show(owner, repo):
    result = get_issues(owner, repo)
    return result


@app.route('/info/pr/<owner>/<repo>')
def show_pr(owner, repo):
    result = get_pull_requests(owner, repo)
    return result


# Retorna as datas da issues com a quantidade daquele dia e tipo de issue (created, closed)
@app.route('/info/issues-dates/<owner>/<repo>')
def show_issues_dates(owner, repo):
    result = issues_dates(owner, repo)

    return result


# Retorna a quantidade de issues criadas por cada participante do projeto
@app.route('/info/issues-authors-lifetime/<owner>/<repo>')
def show_issues_authors_lifetime(owner, repo):
    result = issues_authors_lifetime(owner, repo)

    return result


# Retorna as datas com as info de autor do commit e quantidade de arquivos modificados
@app.route('/info/commits/<owner>/<repo>')
def show_total_commits(owner, repo):
    result = get_commits(owner, repo)

    return result


@app.route('/info/metrics/<owner>/<repo>')
def show_metrics(owner, repo):
    result = metrics(owner, repo)

    return result


if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=50)
