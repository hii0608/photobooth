import { useState, useRef, useCallback } from 'react';
import { ADMIN_PASSWORD } from '../config';
import styles from './StartScreen.module.css';

export default function StartScreen({ onStart, onAdmin }) {
  const [showModal, setShowModal] = useState(false);
  const [pw, setPw]               = useState('');
  const [error, setError]         = useState(false);
  const inputRef = useRef(null);

  const openModal = useCallback(() => {
    setPw('');
    setError(false);
    setShowModal(true);
    // 모달 열린 뒤 input에 포커스
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setPw('');
    setError(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (pw === ADMIN_PASSWORD) {
      setShowModal(false);
      onAdmin();
    } else {
      setError(true);
      setPw('');
      inputRef.current?.focus();
    }
  }, [pw, onAdmin]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter')  handleConfirm();
    if (e.key === 'Escape') closeModal();
  }, [handleConfirm, closeModal]);

  return (
    <div className={styles.container}>
      <div className={styles.overlay}>
        <h1 className={styles.title}>PHOTO BOOTH</h1>
        <button className={styles.startBtn} onClick={onStart}>
          START
        </button>
      </div>

      {/* 관리자 진입 버튼 — 우하단에 조용하게 배치 */}
      <button
        className={styles.adminBtn}
        onClick={openModal}
        aria-label="관리자 설정"
        title="관리자 설정"
      >
        ⚙
      </button>

      {/* 비밀번호 모달 */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.modalTitle}>관리자 인증</p>
            <input
              ref={inputRef}
              type="password"
              className={`${styles.modalInput} ${error ? styles.modalInputError : ''}`}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              onKeyDown={handleKeyDown}
              placeholder="비밀번호를 입력하세요"
              autoComplete="off"
            />
            {error && <p className={styles.modalError}>비밀번호가 올바르지 않습니다.</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={closeModal}>취소</button>
              <button className={styles.modalConfirm} onClick={handleConfirm}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
