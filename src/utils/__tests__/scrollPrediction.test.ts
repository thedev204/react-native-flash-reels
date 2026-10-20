import { predictScrollTarget } from '../scrollPrediction';

describe('predictScrollTarget', () => {
  it('returns zeros for empty data or invalid height', () => {
    expect(
      predictScrollTarget({ offsetY: 0, listHeight: 800, dataLength: 0 })
    ).toEqual({ predictedIndex: 0, direction: 0 });
    expect(
      predictScrollTarget({ offsetY: 100, listHeight: 0, dataLength: 5 })
    ).toEqual({ predictedIndex: 0, direction: 0 });
  });

  it('rounds to the nearest page when idle', () => {
    expect(
      predictScrollTarget({
        offsetY: 800,
        listHeight: 800,
        dataLength: 10,
      })
    ).toEqual({ predictedIndex: 1, direction: 0 });
  });

  it('biases forward with positive velocity mid-page', () => {
    const result = predictScrollTarget({
      offsetY: 900,
      listHeight: 800,
      dataLength: 10,
      velocityY: 1.5,
    });
    expect(result.predictedIndex).toBe(2);
    expect(result.direction).toBe(1);
  });

  it('biases backward with negative velocity mid-page', () => {
    const result = predictScrollTarget({
      offsetY: 700,
      listHeight: 800,
      dataLength: 10,
      velocityY: -1.5,
    });
    expect(result.predictedIndex).toBe(0);
    expect(result.direction).toBe(-1);
  });

  it('clamps to feed edges', () => {
    expect(
      predictScrollTarget({
        offsetY: -100,
        listHeight: 800,
        dataLength: 5,
        velocityY: -2,
      }).predictedIndex
    ).toBe(0);
    expect(
      predictScrollTarget({
        offsetY: 10_000,
        listHeight: 800,
        dataLength: 5,
        velocityY: 2,
      }).predictedIndex
    ).toBe(4);
  });
});
