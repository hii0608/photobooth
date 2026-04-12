import { useState, useCallback } from 'react';
import { useFrames }          from './hooks/useFrames';
import { useCamera }          from './hooks/useCamera';
import LoadingScreen          from './components/LoadingScreen';
import StartScreen            from './components/StartScreen';
import LayoutSelectScreen     from './components/LayoutSelectScreen';
import ShootingScreen         from './components/ShootingScreen';
import ResultScreen           from './components/ResultScreen';

// ── Screen identifiers ────────────────────────────────────
const SCREEN = {
  START   : 'start',
  LAYOUT  : 'layout',
  SHOOTING: 'shooting',
  RESULT  : 'result',
};

export default function App() {
  const { frameCanvases, loading, error } = useFrames();
  const { videoRef, startCamera, stopCamera } = useCamera();

  const [screen, setScreen]         = useState(SCREEN.START);
  const [layout, setLayout]         = useState(null);   // 선택된 layout 객체
  const [capturedPhotos, setCaptured] = useState([]);

  // START → LAYOUT SELECT
  const handleStart = useCallback(() => {
    setScreen(SCREEN.LAYOUT);
  }, []);

  // LAYOUT SELECT → SHOOTING
  const handleLayoutSelect = useCallback(async (selectedLayout) => {
    setLayout(selectedLayout);
    setCaptured([]);
    setScreen(SCREEN.SHOOTING);
    try {
      await startCamera();
    } catch (err) {
      console.error('카메라 오류:', err);
      alert('카메라를 사용할 수 없습니다: ' + err.message);
      setScreen(SCREEN.LAYOUT);
    }
  }, [startCamera]);

  // SHOOTING → RESULT
  const handleComplete = useCallback((photos) => {
    stopCamera();
    setCaptured(photos);
    setScreen(SCREEN.RESULT);
  }, [stopCamera]);

  // RESULT → LAYOUT SELECT (Retake: 레이아웃부터 다시 선택)
  const handleRetake = useCallback(() => {
    setCaptured([]);
    stopCamera();
    setScreen(SCREEN.LAYOUT);
  }, [stopCamera]);

  if (loading || error) return <LoadingScreen error={error} />;

  return (
    <>
      {screen === SCREEN.START && (
        <StartScreen onStart={handleStart} />
      )}
      {screen === SCREEN.LAYOUT && (
        <LayoutSelectScreen onSelect={handleLayoutSelect} />
      )}
      {screen === SCREEN.SHOOTING && layout && (
        <ShootingScreen
          frameCanvases={frameCanvases}
          layout={layout}
          videoRef={videoRef}
          onComplete={handleComplete}
        />
      )}
      {screen === SCREEN.RESULT && layout && (
        <ResultScreen
          capturedPhotos={capturedPhotos}
          layout={layout}
          onRetake={handleRetake}
        />
      )}
    </>
  );
}
