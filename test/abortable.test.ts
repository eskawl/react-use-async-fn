import { act, renderHook } from "@testing-library/react";
import { STATUSES, useAbortableAsync } from "../src";

describe("useAbortableAsync", () => {
  describe("optional args", () => {
    it("should work with only the fn provided", () => {
      const { result } = renderHook(() =>
        useAbortableAsync({
          fn: async () => 1,
        }),
      );

      const [bag, { trigger, abort }] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);
      expect(abort).not.toBe(undefined);

      const { data, error, status, isLoading } = bag;
      expect(data).toBe(null);
      expect(error).toBe(null);
      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);
    });
    it("should work without onDone", () => {
      const { result } = renderHook(() =>
        useAbortableAsync({
          fn: async () => 1,
          onError: () => void 0,
        }),
      );

      const [bag, { trigger, abort }] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);
      expect(abort).not.toBe(undefined);

      const { data, error, status, isLoading } = bag;
      expect(data).toBe(null);
      expect(error).toBe(null);
      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);
    });
    it("should work without onError", () => {
      const { result } = renderHook(() =>
        useAbortableAsync({
          fn: async () => 1,
          onDone: () => void 0,
        }),
      );

      const [bag, { trigger, abort }] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);
      expect(abort).not.toBe(undefined);

      const { data, error, status, isLoading } = bag;
      expect(data).toBe(null);
      expect(error).toBe(null);
      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);
    });
  });

  describe("behaviour", () => {
    afterEach(jest.resetAllMocks);

    it("should not trigger automatically", () => {
      const workFn = jest.fn().mockImplementation(async () => 0);

      renderHook(() =>
        useAbortableAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      expect(workFn.mock.calls.length).toBe(0);
    });
    it("should not trigger automatically when props change", () => {
      const workFn = jest.fn().mockImplementation(async () => 0);

      const { rerender } = renderHook(() =>
        useAbortableAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      rerender({
        fn: workFn,
        onDone: () => void 1,
      });

      expect(workFn.mock.calls.length).toBe(0);
    });
    it("should trigger when triggered", async () => {
      const workFn = jest.fn().mockImplementation(async () => {
        return "TEST_RETURN";
      });

      const { result } = renderHook(() =>
        useAbortableAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      const [_, { trigger }] = result.current;

      let asyncResult;
      await act(async () => {
        asyncResult = await trigger(1, 2, 3);
      });

      expect(workFn.mock.calls.length).toBe(1);
      expect(workFn.mock.calls.at(0).slice(0, 3)).toStrictEqual([1, 2, 3]);
      expect(workFn.mock.calls.at(0).at(3)?.abortSignal).toBeInstanceOf(
        AbortSignal,
      );
      expect(asyncResult).toBe("TEST_RETURN");
    });
    it("should abort when aborted", async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, "abort");

      const workFn = jest.fn().mockImplementation(async () => {
        return "TEST_RETURN";
      });

      const { result } = renderHook(() =>
        useAbortableAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      const [_, { trigger, abort }] = result.current;

      await act(async () => {
        trigger(1, 2, 3);
        await abort();
      });

      expect(abortSpy.mock.calls.length).toBe(1);

      abortSpy.mockRestore();
    });
    it.todo("should use new fn when fn changes");
  });
});
