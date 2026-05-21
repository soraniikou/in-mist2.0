import { useState } from 'react'
import TopScreen from './components/TopScreen'
import PlaceScreen from './components/PlaceScreen'
import StayScreen from './components/StayScreen'
import ErrorBoundary from './components/ErrorBoundary'

type Screen = 'top' | 'place' | 'stay'

export default function App() {
  const [screen, setScreen] = useState<Screen>('top')

  return (
    <>
      {screen === 'top' && (
        <ErrorBoundary screenName="TopScreen">
          <TopScreen
            onPlace={() => setScreen('place')}
            onStay={() => setScreen('stay')}
          />
        </ErrorBoundary>
      )}
      {screen === 'place' && (
        <ErrorBoundary screenName="PlaceScreen">
          <PlaceScreen onBack={() => setScreen('top')} />
        </ErrorBoundary>
      )}
      {screen === 'stay' && (
        <ErrorBoundary screenName="StayScreen">
          <StayScreen onBack={() => setScreen('top')} />
        </ErrorBoundary>
      )}
    </>
  )
}
