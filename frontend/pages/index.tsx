/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';
import Head from 'next/head';
import { useState } from 'react';
import IssuesSection from '../components/Issues/IssuesSection';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [issuesDates, setIssuesDates] = useState<any>([]);
  const [issuesLifetime, setIssuesLifetime] = useState<any>([]);
  const [issuesAuthors, setIssuesAuthors] = useState<any>([]);
  const [pullRequests, setPullRequests] = useState<any>([]);
  const [commits, setCommits] = useState<any>([]);
  const [metrics, setMetrics] = useState<any>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const loadData = async () => {
    setShowError(false);
    setIsLoading(true);
    setIsDataReady(false);
    const urlParts = repoUrl.split('/');

    try {
      const responses = await Promise.all([
        axios.get(
          `https://20.163.20.169.nip.io/info/issues-dates/${
            urlParts[urlParts.length - 2]
          }/${urlParts[urlParts.length - 1]}`
        ),
        axios.get(
          `https://20.163.20.169.nip.io/info/issues-authors-lifetime/${
            urlParts[urlParts.length - 2]
          }/${urlParts[urlParts.length - 1]}`
        ),
        axios.get(
          `https://20.163.20.169.nip.io/info/pr/${
            urlParts[urlParts.length - 2]
          }/${urlParts[urlParts.length - 1]}`
        ),
        axios.get(
          `https://20.163.20.169.nip.io/info/commits/${
            urlParts[urlParts.length - 2]
          }/${urlParts[urlParts.length - 1]}`
        ),
        axios.get(
          `https://20.163.20.169.nip.io/info/metrics/${
            urlParts[urlParts.length - 2]
          }/${urlParts[urlParts.length - 1]}`
        ),
      ]);

      setIssuesDates(responses[0]);
      setIssuesLifetime(responses[1]);
      setIssuesAuthors(responses[1]);
      setPullRequests(responses[2]);
      setCommits(responses[3]);
      setMetrics(responses[4]);

      setIsDataReady(true);
      setIsLoading(false);
    } catch (e) {
      setShowError(true);
      setIsLoading(false);
    }
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
          <div className={styles.buttonContainer}>
            <button
              className={styles.button}
              onClick={() => {
                if (repoUrl.length > 0) loadData();
              }}
            >
              Exibir
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setRepoUrl('ES2-UFPI/maltese');
                if (repoUrl.length > 0) loadData();
              }}
            >
              MalteseRepo
            </button>
          </div>
        </div>
        <span className={styles.description}>
          Aplicação para ver a evolução de projetos de ES2.
        </span>
      </div>
      {!isDataReady ? (
        <>
          {isLoading ? (
            <span>Carregando...</span>
          ) : (
            <>
              {showError ? (
                <span>Ocorreu um erro</span>
              ) : (
                <span>O gráfico aparecerá aqui.</span>
              )}
            </>
          )}
        </>
      ) : (
        <IssuesSection
          issuesDates={issuesDates}
          issuesLifetime={issuesLifetime}
          issuesAuthors={issuesAuthors}
          pullRequests={pullRequests}
          commits={commits}
          metrics={metrics}
        />
      )}
    </div>
  );
}
