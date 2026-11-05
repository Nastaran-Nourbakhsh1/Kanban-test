import { describe, it, expect } from "vitest";
import { initialBoard, boardReducer } from "../src/lib/board";
describe("board state", () => {
  it("starts with exactly five fixed columns and fresh sample data", () => {
    const board = initialBoard();
    expect(board).toHaveLength(5);
    expect(board.every((c) => c.cards.length > 0)).toBe(true);
    board[0].cards.pop();
    expect(initialBoard()[0].cards).toHaveLength(2);
  });
  it("adds a trimmed title to only the selected column without mutating state", () => {
    const state = initialBoard();
    const before = structuredClone(state);
    const next = boardReducer(state, {
      type: "add",
      columnId: state[1].id,
      card: { id: "new", title: "  عنوان  ", details: "متن\nدوم" },
    });
    expect(next[1].cards.at(-1)).toEqual({
      id: "new",
      title: "عنوان",
      details: "متن\nدوم",
    });
    expect(next[0]).toBe(state[0]);
    expect(state).toEqual(before);
    expect(next).toHaveLength(5);
  });
  it("rejects blank titles and blank column names", () => {
    const state = initialBoard();
    expect(
      boardReducer(state, {
        type: "add",
        columnId: state[0].id,
        card: { id: "x", title: "  ", details: "" },
      }),
    ).toBe(state);
    expect(
      boardReducer(state, {
        type: "rename",
        columnId: state[0].id,
        name: "  ",
      }),
    ).toBe(state);
  });
  it("renames a column while retaining its identity and cards", () => {
    const state = initialBoard();
    const next = boardReducer(state, {
      type: "rename",
      columnId: state[0].id,
      name: "  جدید  ",
    });
    expect(next[0]).toEqual({ ...state[0], name: "جدید" });
    expect(state[0].name).toBe("ایده‌ها");
    expect(next[0].cards).toBe(state[0].cards);
  });
  it("moves between columns at a specific position without losing or duplicating cards", () => {
    const state = initialBoard();
    const before = structuredClone(state);
    const card = state[0].cards[0];
    const next = boardReducer(state, {
      type: "move",
      cardId: card.id,
      columnId: state[1].id,
      index: 1,
    });
    expect(next[1].cards[1]).toBe(card);
    expect(next[0].cards).toHaveLength(1);
    expect(next.flatMap((c) => c.cards)).toHaveLength(9);
    expect(state).toEqual(before);
  });
  it("reorders inside a column and appends to an empty column", () => {
    const state = initialBoard();
    const card = state[0].cards[0];
    const reordered = boardReducer(state, {
      type: "move",
      cardId: card.id,
      columnId: state[0].id,
      index: 1,
    });
    expect(reordered[0].cards[1]).toBe(card);
    const empty = state.map((c) =>
      c.id === state[4].id ? { ...c, cards: [] } : c,
    );
    expect(
      boardReducer(empty, {
        type: "move",
        cardId: card.id,
        columnId: state[4].id,
      })[4].cards,
    ).toEqual([card]);
  });
  it("deletes only the selected card and ignores invalid moves", () => {
    const state = initialBoard();
    const next = boardReducer(state, {
      type: "delete",
      cardId: state[0].cards[0].id,
    });
    expect(next[0].cards).toEqual([state[0].cards[1]]);
    expect(state[0].cards).toHaveLength(2);
    expect(
      boardReducer(state, {
        type: "move",
        cardId: "missing",
        columnId: state[0].id,
      }),
    ).toBe(state);
    expect(
      boardReducer(state, {
        type: "move",
        cardId: state[0].cards[0].id,
        columnId: "missing",
      }),
    ).toBe(state);
  });
});
