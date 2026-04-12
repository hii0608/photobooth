import styles from './StartScreen.module.css';

export default function StartScreen({ onStart }) {
  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>PHOTO BOOTH</h1>
        <button className={styles.startBtn} onClick={onStart}>
          START
        </button>
      </div>
    </div>
  );
}
