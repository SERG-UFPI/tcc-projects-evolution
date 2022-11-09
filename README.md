# Introdução
Trabalho sobre o desenvolvimento de uma ferramenta que verifica a evolução de projetos de software que se encontram no Github. No qual é possível verificar algumas informações analíticas, como por exemplo números de issues criadas e fechadas em determinado período, a distruição de issues criadas por participantes no projeto, entre outras. Link da [ferramenta](https://tcc-projects-evolution.herokuapp.com/).

---

## ⚙️ Pré-requisitos
### Python e Node
Para este trabalho o framework Flask da linguagem [Python](https://www.python.org/downloads/) foi utilizado no backend e NextJS da linguaguem [Javascript](https://nodejs.org/en/) para o frontend.

### Backend
Para a instalação dos pacotes recomenda-se a utilização de uma "env", local onde seram instalados os pacotes. Para criar uma env: 
```
python -m venv nome-da-env
```
Em seguida entre na env e execute a instalação dos pacotes do projeto:
* Windows: .\nome-da-env\Scripts\activate && pip install -r requirements.txt
* Linux: . nome-da-env/bin/activate && pip3 install -r requirements.txt

### Frontend
Para a instalação das dependências basta apenas executar o comando:
```
npm install
```

---

## 🛠️ Como executar
### Backend:
Dentro da env criada execute:
```
flask run
```

### Frontend: 
```
npm start
```