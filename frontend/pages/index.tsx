import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Carregando...</div>
})

export default function Home() {
  const [createdAt, setCreatedAt] = useState([])
  const [countCreatedAt, setCountCreatedAt] = useState([])
  const [closedAt, setClosedAt] = useState([])
  const [countClosedAt, setCountClosedAt] = useState([])
  const [authors, setAuthors] =  useState([])
  const [authorsTotalIssues, setAuthorsTotalIssues] =  useState([])
  const [showPlot, setShowPlot] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [isDataReady, setIsDataReady] = useState(false)

  const loadData = async () => {
    setIsDataReady(false)
    const urlParts = repoUrl.split('/')

    let parsedStart = undefined
    let parsedEnd = undefined

    if(!start && !end) {
      parsedStart = ''
      parsedEnd = ''
    } 
    else if(start && !end) parsedStart = start.replace(/-/g, "")
    else if(!start && end) parsedEnd = end.replace(/-/g, "")
    else {
      parsedStart = start.replace(/-/g, "")
      parsedEnd = end.replace(/-/g, "")
    }
    
    //const response = await axios.get(`https://tcc-eng-api.herokuapp.com/info/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`)
    //const response = await axios.get(`http://18.207.222.22/info/issues-dates/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`)
    const response = await axios.get(`http://18.207.222.22/info/issues-dates/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}?start=${parsedStart}&end=${parsedEnd}`)
    const authorsResponse  = await axios.get(`http://18.207.222.22/info/issues-authors/${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`)
    const dateCreatedList = []
    const dateClosedList = []
    const occurrencesByDateCreated = []
    const occurrencesByDateClosed = []
    
    Object.keys(response.data).forEach(key => {
      response.data[key].forEach(el => {
        const parsed = key.slice(0, 4) + '-' + key.slice(4, 6) + '-' + key.slice(6, 8)
        
        if(el['type'] == 'created') {
          dateCreatedList.push(parsed)
          occurrencesByDateCreated.push(el['total'])
        } else {
          dateClosedList.push(parsed)
          occurrencesByDateClosed.push(el['total'])
        }
      })
    })

    const authorsList = []
    const authorsTotalIssuesList = []
    Object.keys(authorsResponse.data).forEach(key => {
      authorsList.push(key)
      authorsTotalIssuesList.push(authorsResponse.data[key])
    })

    setCreatedAt([...dateCreatedList])
    setCountCreatedAt([...occurrencesByDateCreated])
    setClosedAt([...dateClosedList])
    setCountClosedAt([...occurrencesByDateClosed])
    setAuthors([...authorsList])
    setAuthorsTotalIssues([...authorsTotalIssuesList])

    setIsDataReady(true)
  }

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <span className={styles.title}>TCC Alexander</span>
        <div className={styles.repoInput}>
          <input placeholder='Link do repositório' className={styles.input}
            onChange={(ev) => {
              setRepoUrl(ev.target.value)
            }} />
          <input placeholder='Data Inicial - Formato: YYYY-MM-DD' className={styles.inputData}
            onChange={(ev) => {
              setStart(ev.target.value)
            }} />
          <input placeholder='Data Final - Formato: YYYY-MM-DD' className={styles.inputData}
            onChange={(ev) => {
              setEnd(ev.target.value)
            }} />
          <button
            className={styles.button}
            onClick={() => {
              if (repoUrl.length > 0)
                loadData()
            }}>
            Exibir
          </button>
        </div>
        <span className={styles.description}>
          Aplicação para ver a evolução de projetos de ES2
        </span>
      </div>
      {!isDataReady ? (
        <span>O gráfico aparecerá aqui.</span>
      ) : (
        <div className={styles.pageComponents}>
          <>
          <div className={styles.plot}>
            <Plot data={[
              {
                x: createdAt,
                y: countCreatedAt,
                type: 'bar',
                name: 'Criadas',
                marker: {
                  color: 'rgb(58, 156, 31)',
                }
              },
              {
                x: closedAt,
                y: countClosedAt,
                
                type: 'bar',
                name: 'Fechadas',
                marker: {
                  color: 'rgb(242, 47, 36)',
                }
              },
            ]}
              layout={
                {
                  barmode: 'stack',
                  title: 'Issues',
                  font: {
                    family: 'Arial, sans-serif',
                    color: '#111111'
                  },
                  xaxis: {
                    type: 'date',
                    title: 'Datas',
                  },
                  yaxis: {
                    title: 'Quantidade de issues'
                  },
                  plot_bgcolor: '#fafafa',
                  paper_bgcolor: '#fafafa',
                  width: 550
                }
            }
            />
          </div>
          {/* <button className={styles.button} onClick={() => {
            setShowPlot(!showPlot)
          }}>{showPlot ? 'Mostrar issues abertas' : 'Mostrar issues fechadas'}</button> */}
        
        </>
          <>
          <div className={styles.plot}>
            <Plot data={[
              {
                type: 'pie',
                values: authorsTotalIssues,
                labels: authors,
                textinfo: "label+percent",
                textposition: "inside",
                automargin: true,
                //title: "Autores de Issues"
              },
            ]}
              layout={
                {
                  height: 400,
                  width: 400,
                  margin: {"t": 50, "b": 50, "l": 0, "r": 0},
                  showlegend: false
                }
            }
            />
          </div>
          {/* <button className={styles.button} onClick={() => {
            setShowPlot(!showPlot)
          }}>{showPlot ? 'Mostrar issues abertas' : 'Mostrar issues fechadas'}</button> */}
        
        </>
        </div>
      )
      }
    </div>
  )
}
