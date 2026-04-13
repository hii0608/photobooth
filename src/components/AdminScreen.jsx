import { useState } from 'react';
import { useParticleAssets } from '../hooks/useParticleAssets';
import ParticleEditor from './ParticleEditor';
import styles from './AdminScreen.module.css';

const ANIM_LABEL = {
  bubble: '거품',
  cherry: '꽃잎',
  wind  : '바람',
  fish  : '유영',
  sway  : '흔들',
  fall  : '낙하',
  float : '부유',
};

export default function AdminScreen({ onBack }) {
  const { assets, saveAsset, toggleVisible, deleteAsset } = useParticleAssets();
  const [editing, setEditing] = useState(null); // null | 'new' | asset 객체

  const handleSave = async (draft, newFiles, keepIds) => {
    await saveAsset(draft, newFiles, keepIds);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 에셋을 삭제하시겠습니까?')) return;
    await deleteAsset(id);
  };

  // ── 에디터 열린 상태 ────────────────────────────────────────
  if (editing !== null) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setEditing(null)}>
            ← 목록으로
          </button>
        </div>
        <div className={styles.editorWrap}>
          <ParticleEditor
            initialAsset={editing === 'new' ? undefined : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  // ── 목록 ────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← 돌아가기</button>
        <h2 className={styles.title}>파티클 에셋 관리</h2>
      </div>

      <div className={styles.desc}>
        <p>이미지를 업로드해서 촬영 화면에 표시할 파티클 효과를 만들 수 있습니다.</p>
        <p>눈 모양처럼 작은 이미지 → 작은 파티클, 큰 이미지 → 큰 파티클로 표시됩니다.</p>
      </div>

      <button
        className={styles.btnNew}
        onClick={() => setEditing('new')}
      >
        + 새 에셋 만들기
      </button>

      {assets.length === 0 ? (
        <div className={styles.empty}>
          <p>아직 에셋이 없습니다.</p>
          <p>위 버튼을 눌러 첫 번째 파티클 에셋을 만들어보세요!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {assets.map((asset) => (
            <div key={asset.id} className={styles.card}>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{asset.name}</span>
                <span className={styles.cardMeta}>
                  {ANIM_LABEL[asset.animType] ?? asset.animType}
                  &nbsp;·&nbsp;속도 {asset.speed}×
                  &nbsp;·&nbsp;{asset.count}개
                  &nbsp;·&nbsp;이미지 {asset.imageIds?.length ?? 0}장
                </span>
              </div>

              <div className={styles.cardActions}>
                {/* 노출 토글 */}
                <label
                  className={styles.visibleToggle}
                  title={asset.visible ? '클릭 시 사용자에게 숨김' : '클릭 시 사용자에게 표시'}
                >
                  <span
                    className={`${styles.toggle} ${asset.visible ? styles.toggleOn : ''}`}
                    onClick={() => toggleVisible(asset.id)}
                  >
                    <span className={styles.toggleThumb} />
                  </span>
                  <span className={styles.visibleLabel}>
                    {asset.visible ? '표시 중' : '숨김'}
                  </span>
                </label>

                <button
                  className={styles.btnEdit}
                  onClick={() => setEditing(asset)}
                >
                  수정
                </button>
                <button
                  className={styles.btnDelete}
                  onClick={() => handleDelete(asset.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
