import { useCallback, useEffect, useState } from 'react'

// const { data, loading, error, reload } = useFetch(() => routeService.list(), [])
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, requestKey: null })
  const [tick, setTick] = useState(0)
  const requestKey = JSON.stringify([deps, tick])

  useEffect(() => {
    let alive = true
    fetcher()
      .then((data) => alive && setState({ data, loading: false, error: null, requestKey }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message || 'Something went wrong', requestKey }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, loading: state.loading || state.requestKey !== requestKey, reload }
}