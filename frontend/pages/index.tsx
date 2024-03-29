import axios from 'axios';
import Head from 'next/head';
import { useState } from 'react';
import IssuesSection from '../components/Issues/IssuesSection';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [issues, setIssues] = useState<any>([]);
  const [pullRequests, setPullRequests] = useState<any>([]);
  const [commits, setCommits] = useState<any>([]);
  const [branches, setBranches] = useState<any>([]);
  const [repository, setRepository] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const loadData = async () => {
    setShowError(false);
    setIsLoading(true);
    setIsDataReady(false);
    const urlParts = repoUrl.split('/');
    const [owner, repo] = [
      urlParts[urlParts.length - 2],
      urlParts[urlParts.length - 1],
    ];

    try {
      const responses = await Promise.all([
        axios.get(
          `https://34.231.225.217.nip.io:7001/info/users/${owner}/${repo}`
        ),
        axios.get(
          `https://34.231.225.217.nip.io:7001/info/issues/${owner}/${repo}`
        ),
        axios.get(
          `https://34.231.225.217.nip.io:7001/info/commits/${owner}/${repo}`
        ),
        axios.get(
          `https://34.231.225.217.nip.io:7001/info/branches/${owner}/${repo}`
        ),
        axios.get(
          `https://34.231.225.217.nip.io:7001/info/pr/${owner}/${repo}`
        ),
      ]);
      setUsers(responses[0]);
      setIssues(responses[1]);
      setCommits(responses[2]);
      setBranches(responses[3]);
      setPullRequests(responses[4]);
      setRepository([owner, repo]);

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
          <title>PEM</title>
        </Head>
      </div>
      <div className={styles.header}>
        <span className={styles.title}>Ferramenta PEM</span>
        <span style={{ fontSize: 15, padding: 10, marginTop: -20 }}>
          ~Project Evolution Monitoring~
        </span>
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
          {...{
            repository,
            issues,
            pullRequests,
            commits,
            branches,
            users,
          }}
        />
      )}
    </div>
  );
}
