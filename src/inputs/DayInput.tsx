// 원본: src/app/(root)/_sample/_components/SampleTimeTableInputList.tsx
// 하루치(카드 1장)만 그리도록 줄임. 데이터 흐름·마크업·클래스는 원본 그대로.
// 원본의 context(TimeTableContext) 대신 부모(App)의 작은 상태를 props로 받는다.
import React from "react";
import type { TDefaultCard, TEntry } from "../lib/types";
import { weekdays } from "../lib/format";
import { cn, type SizeProps } from "../lib/utils";
import {
  CARD_INPUT_CONFIG,
  maxStreamingTimeByDay,
  type SimpleFieldConfig,
  type TLanOpt,
} from "../card/settings";
import AdaptiveTimeRenderer from "./AdaptiveTimeRenderer";
import TextareaRenderer from "./TextareaRenderer";
import TextRenderer from "./TextRenderer";
import { DayCard } from "./DayCard";
import { EntryCard } from "./EntryCard";
import { buttonVariants } from "./styles";
import { SubToggle } from "./SubToggle";

/** 원본: utils/time-table/data.ts createInitialEntryFromConfig */
export const createInitialEntry = (): TEntry => {
  const entry: TEntry = { time: "09:00", mainTitle: "", isGuerrilla: false };
  CARD_INPUT_CONFIG.fields.forEach((field) => {
    entry[field.key] = field.defaultValue;
  });
  return entry;
};

export const createInitialDay = (day: number): TDefaultCard => ({
  day,
  isOffline: false,
  entries: [createInitialEntry()],
});

interface DayInputProps {
  day: TDefaultCard;
  onChange: (next: TDefaultCard) => void;
  weekdayOption: TLanOpt;
  size?: SizeProps;
  isMultiple?: boolean;
}

type FieldValue = string | number | boolean;

const DayInput: React.FC<DayInputProps> = ({
  day,
  onChange,
  weekdayOption,
  size = "md",
  isMultiple = true,
}) => {
  const offlineToggleConfig = CARD_INPUT_CONFIG.offlineToggle;

  const handleEntryFieldChange = (
    entryIndex: number,
    field: string,
    value: FieldValue
  ) => {
    const newEntries = [...day.entries];
    newEntries[entryIndex] = { ...newEntries[entryIndex], [field]: value };
    onChange({ ...day, entries: newEntries });
  };

  const handleOfflineToggle = () => {
    onChange({ ...day, isOffline: !day.isOffline });
  };

  const handleAddEntry = () => {
    if (day.entries.length >= maxStreamingTimeByDay) return;
    onChange({ ...day, entries: [...day.entries, createInitialEntry()] });
  };

  const handleRemoveEntry = (entryIndex: number) => {
    const newEntries = day.entries.filter((_, index) => index !== entryIndex);
    if (newEntries.length === 0) newEntries.push(createInitialEntry());
    onChange({ ...day, entries: newEntries });
  };

  // 원본 defaultFieldRenderers.time
  const renderTimeField = (entry: TEntry, entryIndex: number) => {
    const fieldId = `time-${day.day}-${entryIndex}`;
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <AdaptiveTimeRenderer
            height={size}
            id={fieldId}
            value={entry.time as string}
            onChange={(newValue) =>
              handleEntryFieldChange(entryIndex, "time", newValue)
            }
            disabled={entry.isGuerrilla}
          />
        </div>
        <SubToggle
          active={entry.isGuerrilla || false}
          onToggle={() =>
            handleEntryFieldChange(entryIndex, "isGuerrilla", !entry.isGuerrilla)
          }
          label="게릴라"
          variant="guerrilla"
          size="sm"
          ariaLabel="게릴라방송 토글"
          title={entry.isGuerrilla ? "게릴라방송 ON" : "게릴라방송 OFF"}
        />
      </div>
    );
  };

  // 원본 renderInputField (text / textarea)
  const renderInputField = (
    fieldConfig: SimpleFieldConfig,
    entry: TEntry,
    entryIndex: number
  ) => {
    const value = String(entry[fieldConfig.key] || fieldConfig.defaultValue || "");
    if (fieldConfig.type === "textarea") {
      return (
        <TextareaRenderer
          value={value}
          placeholder={fieldConfig.placeholder || ""}
          handleTextareaChange={(v) =>
            handleEntryFieldChange(entryIndex, fieldConfig.key, v)
          }
          maxLength={fieldConfig.maxLength}
          required={fieldConfig.required}
          rows={3}
          aria-label="메인 타이틀"
        />
      );
    }
    return (
      <TextRenderer
        height={size}
        value={value}
        placeholder={fieldConfig.placeholder || ""}
        handleTextChange={(v) =>
          handleEntryFieldChange(entryIndex, fieldConfig.key, v)
        }
        maxLength={fieldConfig.maxLength}
        required={fieldConfig.required}
        aria-label="서브 타이틀"
      />
    );
  };

  // 원본 defaultWeekdayRenderer
  const weekdayLabel = (
    <span className="font-semibold text-gray-700">
      {weekdays[weekdayOption][day.day]}
    </span>
  );

  return (
    <DayCard
      size={size}
      weekdayLabel={weekdayLabel}
      isOffline={day.isOffline}
      onOfflineToggle={handleOfflineToggle}
      offlineToggleLabel={offlineToggleConfig.label}
    >
      <div className="flex flex-col gap-6">
        {day.entries.map((entry, entryIndex) => (
          <EntryCard
            key={`${day.day}-${entryIndex}`}
            entry={entry}
            entryIndex={entryIndex}
            showHeader={isMultiple}
            showDeleteButton={isMultiple && day.entries.length > 1}
            onDelete={() => handleRemoveEntry(entryIndex)}
            variant="default"
            size={size}
          >
            {CARD_INPUT_CONFIG.fields.map((fieldConfig) => (
              <div key={fieldConfig.key}>
                {fieldConfig.key === "time"
                  ? renderTimeField(entry, entryIndex)
                  : renderInputField(fieldConfig, entry, entryIndex)}
              </div>
            ))}
          </EntryCard>
        ))}
      </div>

      {isMultiple && day.entries.length < maxStreamingTimeByDay && (
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "light", size, fullWidth: true }),
            "flex items-center justify-center gap-2"
          )}
          onClick={handleAddEntry}
        >
          <span className="text-lg">+</span>
          <span className="text-sm font-medium">
            방송 추가 ({day.entries.length}/{maxStreamingTimeByDay})
          </span>
        </button>
      )}
    </DayCard>
  );
};

export default DayInput;
