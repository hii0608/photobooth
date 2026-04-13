import { useState, useCallback } from 'react';
import { useCamera }          from './hooks/useCamera';
import { useFilter }          from './hooks/useFilter';
import StartScreen            from './components/StartScreen';
import LayoutSelectScreen     from './components/LayoutSelectScreen';
import ThemeSelectScreen      from './components/ThemeSelectScreen';
import ShootingScreen         from './components/ShootingScreen';
import ArrangeScreen          from './components/ArrangeScreen';
import ResultScreen           from './components/ResultScreen';
import AdminScreen            from './components/AdminScreen';

const SCREEN = {
  START   : 'start',
  LAYOUT  : 'layout',
  THEME   : 'theme',
  SHOOTING: 'shooting',
  ARRANGE : 'arrange',
  RESULT  : 'result',
  ADMIN   : 'admin',
};

export default function App() {
  const { videoRef, startCamera, stopCamera } = useCamera();
  const { custom, presetId, filterCss, setPreset, setCustom } = useFilter();

  const [screen, setScreen]                 = useState(SCREEN.START);
  const [layout, setLayout]                 = useState(null);
  const [theme, setTheme]                   = useState(null);
  const [capturedBySlot, setCapturedBySlot] = useState([]);
  const [videosByShot, setVideosByShot]     = useState([]);
  const [capturedPhotos, setCaptured]       = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  const handleStart = useCallback(() => setScreen(SCREEN.LAYOUT), []);
  const handleAdmin = useCallback(() => setScreen(SCREEN.ADMIN), []);

  const handleLayoutSelect = useCallback((selectedLayout) => {
    setLayout(selectedLayout);
    setTheme(null);
    setScreen(SCREEN.THEME);
  }, []);

  const handleThemeSelect = useCallback(async (selectedTheme) => {
    setTheme(selectedTheme);
    setCapturedBySlot([]);
    setVideosByShot([]);
    setCaptured([]);
    setSelectedVideos([]);
    setScreen(SCREEN.SHOOTING);
    try {
      await startCamera();
    } catch (err) {
      console.error('카메라 오류:', err);
      alert('카메라를 사용할 수 없습니다: ' + err.message);
      setScreen(SCREEN.THEME);
    }
  }, [startCamera]);

  const handleShootingComplete = useCallback(({ bySlot, videos }) => {
    stopCamera();
    setCapturedBySlot(bySlot);
    setVideosByShot(videos);
    setScreen(SCREEN.ARRANGE);
  }, [stopCamera]);

  const handleArrangeConfirm = useCallback(({ photos, videos }) => {
    setCaptured(photos);
    setSelectedVideos(videos);
    setScreen(SCREEN.RESULT);
  }, []);

  const handleRetakeFromArrange = useCallback(() => {
    setCapturedBySlot([]);
    setVideosByShot([]);
    stopCamera();
    setScreen(SCREEN.LAYOUT);
  }, [stopCamera]);

  const handleRetake = useCallback(() => {
    setCaptured([]);
    setSelectedVideos([]);
    stopCamera();
    setScreen(SCREEN.LAYOUT);
  }, [stopCamera]);

  return (
    <>
      {screen === SCREEN.ADMIN && (
        <AdminScreen onBack={() => setScreen(SCREEN.START)} />
      )}
      {screen === SCREEN.START && (
        <StartScreen onStart={handleStart} onAdmin={handleAdmin} />
      )}
      {screen === SCREEN.LAYOUT && (
        <LayoutSelectScreen onSelect={handleLayoutSelect} />
      )}
      {screen === SCREEN.THEME && layout && (
        <ThemeSelectScreen
          layout={layout}
          onSelect={handleThemeSelect}
          onBack={() => setScreen(SCREEN.LAYOUT)}
        />
      )}
      {screen === SCREEN.SHOOTING && layout && theme && (
        <ShootingScreen
          layout={layout}
          theme={theme}
          filterCss={filterCss}
          presetId={presetId}
          custom={custom}
          setPreset={setPreset}
          setCustom={setCustom}
          videoRef={videoRef}
          onComplete={handleShootingComplete}
        />
      )}
      {screen === SCREEN.ARRANGE && layout && capturedBySlot.length > 0 && (
        <ArrangeScreen
          capturedBySlot={capturedBySlot}
          videos={videosByShot}
          layout={layout}
          onConfirm={handleArrangeConfirm}
          onRetake={handleRetakeFromArrange}
        />
      )}
      {screen === SCREEN.RESULT && layout && (
        <ResultScreen
          capturedPhotos={capturedPhotos}
          selectedVideos={selectedVideos}
          layout={layout}
          onRetake={handleRetake}
        />
      )}
    </>
  );
}
