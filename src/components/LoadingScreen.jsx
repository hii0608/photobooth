import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ error }) {
  return (
    <div className={styles.wrapper}>
      {error ? (
        <div className={styles.error}>
          <span>⚠️ 프레임 이미지 로드 실패</span>
          <small>{error}</small>
          <small style={{ opacity: 0.5 }}>
            /public/frames/ 폴더에 PNG 파일을 확인하세요.
          </small>
        </div>
      ) : (
        <>
          <div className={styles.ring} />
          <span className={styles.text}>LOADING</span>
        </>
      )}
    </div>
  );
}
