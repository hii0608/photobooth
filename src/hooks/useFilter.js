import { useState, useMemo } from 'react';
import { DEFAULT_CUSTOM, customToCss, FILTER_PRESETS } from '../config/filters';

/**
 * 필터 상태를 관리합니다.
 *
 * Returns:
 *   custom       — 현재 슬라이더 값 객체
 *   presetId     — 현재 선택된 프리셋 ID
 *   filterCss    — 최종 CSS filter 문자열
 *   setPreset    — 프리셋 선택 (슬라이더도 해당 값으로 업데이트)
 *   setCustom    — 슬라이더 개별 값 업데이트
 */
export function useFilter() {
  const [presetId, setPresetId] = useState('none');
  const [custom, setCustomValue] = useState({ ...DEFAULT_CUSTOM });
  const [blur, setBlur]          = useState(0);

  const filterCss = useMemo(
    () => customToCss(custom, blur),
    [custom, blur],
  );

  const setPreset = (id) => {
    const preset = FILTER_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setCustomValue({ ...preset.custom });
    setBlur(preset.blur ?? 0);
  };

  const setCustom = (key, value) => {
    setPresetId('custom');
    setCustomValue((prev) => ({ ...prev, [key]: value }));
  };

  return { custom, presetId, filterCss, setPreset, setCustom };
}
