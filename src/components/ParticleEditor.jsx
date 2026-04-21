import { useRef, useEffect, useState, useCallback } from 'react';
import { CustomParticleEffect, ANIM_TYPES } from '../utils/customParticle';
import { loadParticleImages } from '../utils/particleDB';
import styles from './ParticleEditor.module.css';

const DEFAULT_CONFIG = {
  name     : '',
  animType : 'float',
  speed    : 1,
  count    : 20,
  sizeScale: 1,
  visible  : true,
};

/**
 * 파티클 에셋 생성/수정 에디터
 *
 * Props:
 *   initialAsset  — 수정 시 기존 에셋 객체 (없으면 신규)
 *   onSave(draft, newFiles, keepIds) — 저장 콜백
 *   onCancel()                       — 취소 콜백
 */
export default function ParticleEditor({ initialAsset, onSave, onCancel }) {
  const isEdit = Boolean(initialAsset?.id);

  // ── 폼 상태 ────────────────────────────────────────────────
  const [name,      setName]      = useState(initialAsset?.name      ?? '');
  const [animType,  setAnimType]  = useState(initialAsset?.animType  ?? 'float');
  const [speed,     setSpeed]     = useState(initialAsset?.speed     ?? 1);
  const [count,     setCount]     = useState(initialAsset?.count     ?? 20);
  const [sizeScale, setSizeScale] = useState(initialAsset?.sizeScale ?? 1);
  const [visible,   setVisible]   = useState(initialAsset?.visible   ?? true);

  // 새로 올린 File 목록 + 미리보기 URL
  const [newFiles,     setNewFiles]     = useState([]); // File[]
  const [newPreviews,  setNewPreviews]  = useState([]); // objectURL[]
  // 기존 이미지 (수정 모드)
  const [existingIds,  setExistingIds]  = useState(initialAsset?.imageIds ?? []); // 유지할 ID[]

  // 로드된 기존 이미지 HTMLImageElement[]
  const [existingImgs, setExistingImgs] = useState([]);

  // 저장 중
  const [saving, setSaving] = useState(false);

  // 선택된 스탬프(클릭 시 삭제 버튼 3초간 노출)
  const [selectedStamp, setSelectedStamp] = useState(null); // `existing:<id>` | `new:<idx>`
  const selectTimerRef = useRef(null);
  const selectStamp = useCallback((key) => {
    setSelectedStamp(key);
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => setSelectedStamp(null), 3000);
  }, []);
  useEffect(() => () => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
  }, []);

  // ── 기존 이미지 로드 (수정 모드) ──────────────────────────
  useEffect(() => {
    if (!existingIds.length) { setExistingImgs([]); return; }
    loadParticleImages(existingIds).then(setExistingImgs);
  }, [existingIds.join(',')]); // eslint-disable-line

  // ── 미리보기 캔버스 ────────────────────────────────────────
  const previewRef = useRef(null);
  const effectRef  = useRef(null);
  const rafRef     = useRef(null);

  const currentConfig = { animType, speed, count, sizeScale };

  // 새 파일 업로드 시 HTMLImageElement 변환
  const [newImgs, setNewImgs] = useState([]);
  useEffect(() => {
    const imgs = newPreviews.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
    setNewImgs(imgs);
  }, [newPreviews]);

  // 파티클 효과 재초기화
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const allImgs = [...existingImgs, ...newImgs];
    effectRef.current = new CustomParticleEffect(currentConfig, allImgs);
    effectRef.current.init(canvas.width, canvas.height);
  }, [animType, speed, count, sizeScale, existingImgs, newImgs]);

  // 렌더 루프
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (effectRef.current) {
        effectRef.current.update();
        effectRef.current.draw(ctx);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── 이미지 업로드 ──────────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [...prev, ...urls]);
    e.target.value = ''; // 같은 파일 재업로드 허용
  }, []);

  const removeNewFile = useCallback((idx) => {
    setNewFiles((prev)    => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const removeExisting = useCallback((id) => {
    setExistingIds((prev) => prev.filter((i) => i !== id));
  }, []);

  // ── 저장 ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!name.trim()) { alert('이름을 입력해주세요.'); return; }
    setSaving(true);
    await onSave(
      { id: initialAsset?.id, name: name.trim(), animType, speed, count, sizeScale, visible, createdAt: initialAsset?.createdAt },
      newFiles,
      existingIds,
    );
    setSaving(false);
  }, [name, animType, speed, count, sizeScale, visible, newFiles, existingIds, initialAsset, onSave]);

  const totalImages = existingIds.length + newFiles.length;

  return (
    <div className={styles.editor}>
      <h3 className={styles.title}>{isEdit ? '에셋 수정' : '새 파티클 에셋'}</h3>

      <div className={styles.body}>
        {/* ── 왼쪽: 설정 폼 ─────────────────────────────── */}
        <div className={styles.form}>
          {/* 이름 */}
          <label className={styles.label}>에셋 이름</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 하트, 별, 나뭇잎"
            maxLength={20}
          />

          {/* 이미지 업로드 */}
          <label className={styles.label}>
            이미지 ({totalImages}개)
            <span className={styles.hint}>여러 장 업로드 시 랜덤 표시</span>
          </label>
          <label className={styles.uploadBtn}>
            + 이미지 추가
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </label>

          {/* 기존 이미지 (수정 모드) */}
          {existingImgs.length > 0 && (
            <div className={styles.imgGrid}>
              {existingImgs.map((img, i) => {
                const key = `existing:${existingIds[i]}`;
                const isSelected = selectedStamp === key;
                return (
                  <div
                    key={existingIds[i]}
                    className={`${styles.imgItem} ${isSelected ? styles.imgItemSelected : ''}`}
                    onClick={() => selectStamp(key)}
                  >
                    <img src={img.src} alt="" className={styles.imgThumb} />
                    {isSelected && (
                      <button
                        className={styles.imgRemoveBig}
                        onClick={(e) => { e.stopPropagation(); removeExisting(existingIds[i]); }}
                      >삭제</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 새 이미지 미리보기 */}
          {newPreviews.length > 0 && (
            <div className={styles.imgGrid}>
              {newPreviews.map((url, i) => {
                const key = `new:${i}`;
                const isSelected = selectedStamp === key;
                return (
                  <div
                    key={url}
                    className={`${styles.imgItem} ${isSelected ? styles.imgItemSelected : ''}`}
                    onClick={() => selectStamp(key)}
                  >
                    <img src={url} alt="" className={styles.imgThumb} />
                    {isSelected && (
                      <button
                        className={styles.imgRemoveBig}
                        onClick={(e) => { e.stopPropagation(); removeNewFile(i); setSelectedStamp(null); }}
                      >삭제</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 애니메이션 타입 */}
          <label className={styles.label}>애니메이션 효과</label>
          <div className={styles.animGrid}>
            {ANIM_TYPES.map((t) => (
              <button
                key={t.id}
                className={`${styles.animBtn} ${animType === t.id ? styles.animBtnActive : ''}`}
                onClick={() => setAnimType(t.id)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 속도 */}
          <label className={styles.label}>
            속도&nbsp;<span className={styles.val}>{speed.toFixed(1)}×</span>
          </label>
          <input
            type="range" min="0.3" max="3" step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className={styles.slider}
          />

          {/* 개수 */}
          <label className={styles.label}>
            파티클 수&nbsp;<span className={styles.val}>{count}개</span>
          </label>
          <input
            type="range" min="5" max="50" step="1"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
            className={styles.slider}
          />

          {/* 크기 */}
          <label className={styles.label}>
            크기&nbsp;<span className={styles.val}>{sizeScale.toFixed(1)}×</span>
          </label>
          <input
            type="range" min="0.3" max="3" step="0.1"
            value={sizeScale}
            onChange={(e) => setSizeScale(parseFloat(e.target.value))}
            className={styles.slider}
          />

          {/* 노출 여부 */}
          <label className={styles.toggleRow}>
            <span>사용자 화면에 표시</span>
            <span
              className={`${styles.toggle} ${visible ? styles.toggleOn : ''}`}
              onClick={() => setVisible((v) => !v)}
            >
              <span className={styles.toggleThumb} />
            </span>
          </label>
        </div>

        {/* ── 오른쪽: 미리보기 캔버스 ───────────────────── */}
        <div className={styles.preview}>
          <p className={styles.previewLabel}>미리보기</p>
          <canvas
            ref={previewRef}
            width={220}
            height={300}
            className={styles.canvas}
          />
          <p className={styles.previewHint}>설정 변경 시 즉시 반영됩니다</p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className={styles.actions}>
        <button className={styles.btnCancel} onClick={onCancel} disabled={saving}>
          취소
        </button>
        <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : (isEdit ? '수정 완료' : '저장')}
        </button>
      </div>
    </div>
  );
}
