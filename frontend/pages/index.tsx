import axios from 'axios';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useState } from 'react';
import styles from '../styles/Home.module.css';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>,
});

export default function Home() {
  const [createdAt, setCreatedAt] = useState([]);
  const [countCreatedAt, setCountCreatedAt] = useState([]);
  const [closedAt, setClosedAt] = useState([]);
  const [countClosedAt, setCountClosedAt] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [authorsTotalIssues, setAuthorsTotalIssues] = useState([]);
  const [commits, setCommits] = useState([]);
  const [authorsTotalCommits, setAuthorsTotalCommits] = useState([]);
  const [lifetimeValues, setlifetimeValues] = useState([]);
  const [addedFiles, setAddedFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [dateCommits, setDateCommits] = useState([]);
  const [showPlot, setShowPlot] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isDataReady, setIsDataReady] = useState(false);

  const loadData = async () => {
    setIsDataReady(false);
    const urlParts = repoUrl.split('/');

    let parsedStart = undefined;
    let parsedEnd = undefined;

    if (!start && !end) {
      parsedStart = '';
      parsedEnd = '';
    } else if (start && !end) {
      parsedStart = start.replace(/-/g, '');
      parsedEnd = '';
    } else if (!start && end) {
      parsedStart = '';
      parsedEnd = end.replace(/-/g, '');
    } else {
      parsedStart = start.replace(/-/g, '');
      parsedEnd = end.replace(/-/g, '');
    }

    const response = await axios.get(
      `https://18.210.151.218.nip.io/info/issues-dates/${
        urlParts[urlParts.length - 2]
      }/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`
    );
    const authorsResponse = await axios.get(
      `https://18.210.151.218.nip.io/info/issues-authors/${
        urlParts[urlParts.length - 2]
      }/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`
    );
    const issuesLifetimeResponse = await axios.get(
      `https://18.210.151.218.nip.io/info/issues-lifetime/${
        urlParts[urlParts.length - 2]
      }/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`
    );
    const commitsAuthorsResponse = await axios.get(
      `https://18.210.151.218.nip.io/info/commits-authors/${
        urlParts[urlParts.length - 2]
      }/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`
    );
    const commitsResponse = await axios.get(
      `https://18.210.151.218.nip.io/info/commits/${
        urlParts[urlParts.length - 2]
      }/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`
    );

    const dateCreatedList = [];
    const dateClosedList = [];
    const occurrencesByDateCreated = [];
    const occurrencesByDateClosed = [];

    Object.keys(response.data).forEach((key) => {
      response.data[key].forEach((el) => {
        const parsed =
          key.slice(0, 4) + '-' + key.slice(4, 6) + '-' + key.slice(6, 8);

        if (el['type'] == 'created') {
          dateCreatedList.push(parsed);
          occurrencesByDateCreated.push(el['total']);
        } else {
          dateClosedList.push(parsed);
          occurrencesByDateClosed.push(el['total']);
        }
      });
    });

    const authorsList = [];
    const authorsTotalIssuesList = [];
    Object.keys(authorsResponse.data).forEach((key) => {
      authorsList.push(key);
      authorsTotalIssuesList.push(authorsResponse.data[key]);
    });

    const commitsAuthorsList = [];
    const commitsAuthorsTotalList = [];
    Object.keys(commitsAuthorsResponse.data).forEach((key) => {
      commitsAuthorsList.push(key);
      commitsAuthorsTotalList.push(commitsAuthorsResponse.data[key]);
    });

    const lifetimeValues = [];
    issuesLifetimeResponse.data['issues'].forEach((el) => {
      lifetimeValues.push(el.active_days);
    });

    const addedFiles = [];
    const removedFiles = [];
    const dates = [];
    Object.keys(commitsResponse.data).forEach((key) => {
      commitsResponse.data[key].forEach((el) => {
        Object.keys(el).forEach((date) => {
          const parsed =
            date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8);
          dates.push(parsed);
          addedFiles.push(el[date]['lines_added']);
          removedFiles.push(-el[date]['lines_removed']);
        });
      });
    });

    console.log(dates)
    console.log(addedFiles)
    console.log(removedFiles)

    setCreatedAt([...dateCreatedList]);
    setCountCreatedAt([...occurrencesByDateCreated]);
    setClosedAt([...dateClosedList]);
    setCountClosedAt([...occurrencesByDateClosed]);
    setAuthors([...authorsList]);
    setAuthorsTotalIssues([...authorsTotalIssuesList]);
    setCommits([...commitsAuthorsList]);
    setAuthorsTotalCommits([...commitsAuthorsTotalList]);
    setlifetimeValues([...lifetimeValues]);
    setDateCommits([...dates]);
    setAddedFiles([...addedFiles]);
    setRemovedFiles([...removedFiles]);

    setIsDataReady(true);
  };

  return (
    <div className={styles.home}>
      <div>
        <Head>
          <title>Projects Evolution</title>
        </Head>
      </div>
      <div className={styles.header}>
        <span className={styles.title}>TCC Projects Evolution</span>
        <div className={styles.repoInput}>
          <input
            placeholder="Link do repositório"
            className={styles.input}
            onChange={(ev) => {
              setRepoUrl(ev.target.value);
            }}
          />
          <input
            placeholder="Data Inicial - Formato: YYYY-MM-DD"
            className={styles.inputData}
            onChange={(ev) => {
              setStart(ev.target.value);
            }}
          />
          <input
            placeholder="Data Final - Formato: YYYY-MM-DD"
            className={styles.inputData}
            onChange={(ev) => {
              setEnd(ev.target.value);
            }}
          />
          <button
            className={styles.button}
            onClick={() => {
              if (repoUrl.length > 0) loadData();
            }}
          >
            Exibir
          </button>
        </div>
        <span className={styles.description}>
          Aplicação para ver a evolução de projetos de ES2.
        </span>
      </div>
      {!isDataReady ? (
        <span>O gráfico aparecerá aqui.</span>
      ) : (
        <div className={styles.pageComponents}>
          <h2 style={{ textAlign: 'center' }}>Issues</h2>
          <div className={styles.issuesContainer}>
            <>
              <div className={styles.plot}>
                <Plot
                  data={[
                    {
                      x: createdAt,
                      y: countCreatedAt,
                      type: 'bar',
                      name: 'Criadas',
                      marker: {
                        color: 'rgb(58, 156, 31)',
                      },
                    },
                    {
                      x: closedAt,
                      y: countClosedAt,

                      type: 'bar',
                      name: 'Fechadas',
                      marker: {
                        color: 'rgb(242, 47, 36)',
                      },
                    },
                  ]}
                  layout={{
                    barmode: 'stack',
                    title: 'Issues',
                    font: {
                      family: 'Arial, sans-serif',
                      color: '#111111',
                    },
                    xaxis: {
                      type: 'date',
                      title: 'Datas',
                    },
                    yaxis: {
                      title: 'Quantidade de issues',
                    },
                    plot_bgcolor: '#fafafa',
                    paper_bgcolor: '#fafafa',
                    width: 550,
                  }}
                />
              </div>
              {/* <button className={styles.button} onClick={() => {
            setShowPlot(!showPlot)
          }}>{showPlot ? 'Mostrar issues abertas' : 'Mostrar issues fechadas'}</button> */}
            </>
            <>
              <div className={styles.plot}>
                <Plot
                  data={[
                    {
                      type: 'violin',
                      y: lifetimeValues,
                      points: false,
                      box: {
                        visible: true,
                      },
                      boxpoints: false,
                      line: {
                        color: 'black',
                      },
                      fillcolor: '#8dd3c7',
                      opacity: 0.6,
                      meanline: {
                        visible: true,
                      },
                      x0: 'Qtd. Issues',
                    },
                  ]}
                  layout={{
                    title: 'Issues Lifetime',
                    yaxis: {
                      zeroline: false,
                      title: 'Dias',
                    },
                  }}
                />
              </div>
            </>
            <>
              <div className={styles.plot}>
                <p>Autores de Issues</p>
                <Plot
                  data={[
                    {
                      type: 'pie',
                      values: authorsTotalIssues,
                      labels: authors,
                      textinfo: 'label+percent',
                      textposition: 'inside',
                      automargin: true,
                    },
                  ]}
                  layout={{
                    height: 400,
                    width: 400,
                    margin: { t: 50, b: 50, l: 0, r: 0 },
                    showlegend: false,
                  }}
                />
              </div>
            </>
          </div>
          <hr />
          <h2 style={{ textAlign: 'center' }}>Commits</h2>
          <div className={styles.commitsContainer}>
            <>
              <div className={styles.plot}>
                <p>Autores de Commits</p>
                <Plot
                  data={[
                    {
                      type: 'pie',
                      values: authorsTotalCommits,
                      labels: commits,
                      textinfo: 'label+percent',
                      textposition: 'inside',
                      automargin: true,
                    },
                  ]}
                  layout={{
                    height: 400,
                    width: 400,
                    margin: { t: 50, b: 50, l: 0, r: 0 },
                    showlegend: false,
                  }}
                />
              </div>
            </>
            <>
              <div className={styles.plot}>
                <p>Linhas Adicionadas e Removidas</p>
                <Plot
                  data={[
                    {
                      y: addedFiles,
                      x: dateCommits,
                      fill: 'tozeroy',
                      type: 'scatter',
                      mode: 'none',
                    },
                    {
                      y: removedFiles,
                      x: dateCommits,
                      fill: 'tozeroy',
                      type: 'scatter',
                      mode: 'none',
                    }
                  ]}
                  layout={{
                    title: '',
                  }}
                />
              </div>
            </>
          </div>
        </div>
      )}
    </div>
  );
}
