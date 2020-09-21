import { SharedValues } from "../components/AnimatedHelpers";

// TODO: since width/height are stable should they be of type Ref?
export type Offset = SharedValues<{
  order: number;
  width: number;
  height: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}>;

const move = (offsets: (Offset | undefined)[], from: number, to: number) => {
  "worklet";
  while (from < 0) {
    from += offsets.length;
  }
  while (to < 0) {
    to += offsets.length;
  }
  if (to >= offsets.length) {
    let k = to - offsets.length;
    while (k-- + 1) {
      offsets.push(undefined);
    }
  }
  offsets.splice(to, 0, offsets.splice(from, 1)[0]);
};

const sortByOrder = (a: Offset, b: Offset) => {
  "worklet";
  return a.order.value > b.order.value ? 1 : -1;
};

export const reorder = (rawOffsets: Offset[], from: number, to: number) => {
  "worklet";
  const offsets = rawOffsets.slice().sort(sortByOrder);
  move(offsets, from, to);
  offsets.forEach((offset, index) => (offset.order.value = index));
};

export const calculateLayout = (
  rawOffsets: Offset[],
  containerWidth: number
) => {
  "worklet";
  const offsets = rawOffsets
    .filter((offset) => offset.order.value !== -1)
    .sort(sortByOrder);
  if (offsets.length === 0) {
    return;
  }
  const height = offsets[0].height.value;
  let vIndex = 0;
  let lastBreak = 0;
  offsets.forEach((offset, index) => {
    const total = offsets
      .slice(lastBreak, index)
      .reduce((acc, o) => acc + o.width.value, 0);
    if (total + offset.width.value > containerWidth) {
      offset.x.value = 0;
      vIndex++;
      lastBreak = index;
    } else {
      offset.x.value = total;
    }
    offset.y.value = vIndex * height;
  });
};