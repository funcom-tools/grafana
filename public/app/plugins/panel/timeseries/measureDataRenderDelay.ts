import { DataFrame, FieldType } from '@grafana/data';
import { LivePerformance, MeasurementName } from 'app/core/services/LivePerformance';
import { closestIdx } from 'app/features/live/data/StreamingDataFrame';

const lastSeenTimeByTimeValuesRef = new WeakMap();

const timeValuesArray = (frame: DataFrame): number[] | undefined =>
  frame.fields?.find((f) => f.type === FieldType.time)?.values?.toArray();

const getLastSeenTime = (newTimeValues: number[], prevFrame: DataFrame): number | undefined => {
  const lastSeenByRef = lastSeenTimeByTimeValuesRef.get(newTimeValues);
  if (lastSeenByRef) {
    return lastSeenByRef;
  }

  const oldValues = timeValuesArray(prevFrame);
  if (oldValues?.length) {
    return oldValues[oldValues.length - 1];
  }

  return undefined;
};

const measureDataRenderDelayForFrame = (prevFrame: DataFrame, newFrame: DataFrame, now: number) => {
  const newValues = timeValuesArray(newFrame);
  if (!newValues?.length) {
    return;
  }

  const lastSeenTime = getLastSeenTime(newValues, prevFrame);
  if (lastSeenTime) {
    const closest = closestIdx(lastSeenTime, newValues);

    const firstBiggerIndex = newValues[closest] > lastSeenTime ? closest : closest + 1;
    if (newValues[firstBiggerIndex]) {
      LivePerformance.instance().add(MeasurementName.DataRenderDelay, now - newValues[firstBiggerIndex]);
    }
  }

  lastSeenTimeByTimeValuesRef.set(newValues, newValues[newValues.length - 1]);
};

export type MeasureDataRenderDelay = (frames: DataFrame[], oldFrames: DataFrame[]) => void;

export const measureDataRenderDelay: MeasureDataRenderDelay = (frames, prevFrames) => {
  const now = Date.now();
  prevFrames.forEach((prevFrame, i) => {
    const newFrame = frames[i];
    if (newFrame) {
      measureDataRenderDelayForFrame(prevFrame, newFrame, now);
    }
  });
};
