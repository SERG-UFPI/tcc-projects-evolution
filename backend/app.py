from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from waitress import serve
from service import (get_commits, get_commits_by_date, get_issues, get_total_changes_by_time,
                     issues_authors, issues_dates)

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


# Retorna as datas da issues com a quantidade daquele dia e tipo de issue (created, closed)
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


# Retorna a quantidade de issues criadas por cada participante do projeto
@app.route('/info/issues-authors/<owner>/<repo>')
def show_issues_authors(owner, repo):
    start = request.args.get('start')
    end = request.args.get('end')

    if(start == ''):
        start = None
    if(end == ''):
        end = None

    result = issues_authors(owner, repo, start, end)
    return result


# Retorna as datas com as info de autor do commit e quantidade de arquivos modificados
@app.route('/info/commits/<owner>/<repo>')
def show_total_commits(owner, repo):
    result = get_commits(owner, repo)
    return result


@app.route('/info/commits-authors/<owner>/<repo>')
def show_commits_by_date(owner, repo):
    start = request.args.get('start')
    end = request.args.get('end')

    if(start == ''):
        start = None
    if(end == ''):
        end = None

    result = get_commits_by_date(owner, repo, start, end)
    return result


# Retorna todos os usuário que fizeram alterações durante determinado período de tempo
@app.route('/info/files-changed/<owner>/<repo>')
def show_total_files_changed(owner, repo):
    start = request.args.get('start')
    end = request.args.get('end')

    if(start == ''):
        start = None
    if(end == ''):
        end = None

    result = get_total_changes_by_time(owner, repo, start, end)
    return result


if __name__ == "__main__":
    serve(app, host='0.0.0.0', port=50)
