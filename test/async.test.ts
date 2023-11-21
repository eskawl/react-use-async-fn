import { act, renderHook, waitFor } from "@testing-library/react";
import { useAsync, STATUSES } from "../src";

describe("useAsync", () => {
  describe("optional args", () => {
    it("should work with only the fn provided", () => {
      const { result } = renderHook(() =>
        useAsync({
          fn: async () => 1,
        }),
      );

      const [bag, trigger] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);

      const { data, error, status, isLoading } = bag;
      expect(data).toBe(null);
      expect(error).toBe(null);
      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);
    });
    it("should work without onDone", () => {
      const { result } = renderHook(() =>
        useAsync({
          fn: async () => 1,
          onError: () => void 0,
        }),
      );

      const [bag, trigger] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);

      const { data, error, status, isLoading } = bag;
      expect(data).toBe(null);
      expect(error).toBe(null);
      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);
    });
    it("should work without onError", () => {
      const { result } = renderHook(() =>
        useAsync({
          fn: async () => 1,
          onDone: () => void 0,
        }),
      );

      const [bag, trigger] = result.current;

      expect(bag).not.toBe(undefined);
      expect(trigger).not.toBe(undefined);

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
        useAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      expect(workFn.mock.calls.length).toBe(0);
    });
    it("should not trigger automatically when props change", () => {
      const workFn = jest.fn().mockImplementation(async () => 0);

      const { rerender } = renderHook(() =>
        useAsync({
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
      const workFn = jest.fn().mockImplementation(async () => "TEST_RETURN");

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
          onDone: () => void 0,
        }),
      );

      const [_, trigger] = result.current;

      let asyncResult;
      await act(async () => {
        asyncResult = await trigger(1, 2, 3);
      });

      expect(workFn.mock.calls.length).toBe(1);
      expect(workFn.mock.calls.at(0)).toStrictEqual([1, 2, 3]);
      expect(asyncResult).toBe("TEST_RETURN");
    });
    it.todo("should use new fn when fn changes");
  });

  describe("data", () => {
    it("should set status properly", async () => {
      jest.useFakeTimers();

      const workFn = jest
        .fn()
        .mockImplementation(
          () => new Promise((r) => setTimeout(() => r("TEST_RESULT"), 1000)),
        );

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
        }),
      );

      let [{ status, isLoading }] = result.current;
      const [_, trigger] = result.current;

      expect(status).toBe(STATUSES.INITIAL);
      expect(isLoading).toBe(false);

      await act(async () => {
        trigger(1, 2, 3);
      });

      [{ status, isLoading }] = result.current;
      expect(status).toBe(STATUSES.WORKING);
      expect(isLoading).toBe(true);

      jest.advanceTimersByTime(500);

      [{ status, isLoading }] = result.current;
      expect(status).toBe(STATUSES.WORKING);
      expect(isLoading).toBe(true);

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        const [{ data }] = result.current;

        expect(data).toBe("TEST_RESULT");
      });

      [{ status, isLoading }] = result.current;
      expect(status).toBe(STATUSES.DONE);
      expect(isLoading).toBe(false);

      jest.useRealTimers();
    });
    it("should set data properly if success", async () => {
      const workFn = jest.fn().mockImplementation(async () => "TEST_RESULT");

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
        }),
      );

      const [_bag, trigger] = result.current;

      await act(async () => {
        trigger(1, 2, 3);
      });

      await waitFor(() => {
        const [{ data }] = result.current;

        expect(data).toBe("TEST_RESULT");
      });
    });
    it("should set data properly if failed", async () => {
      const workFn = jest.fn().mockImplementation(async () => {
        throw "TEST_RESULT";
      });

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
        }),
      );

      const [_bag, trigger] = result.current;

      await act(async () => {
        trigger(1, 2, 3);
      });

      await waitFor(() => {
        const [{ error }] = result.current;

        expect(error).toBe("TEST_RESULT");
      });
    });
  });

  describe("callbacks", () => {
    it("should call onDone on success", async () => {
      const workFn = jest.fn().mockImplementation(async () => "TEST_RESULT");
      const onDone = jest.fn();

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
          onDone,
        }),
      );

      const [_bag, trigger] = result.current;

      await act(async () => {
        trigger(1, 2, 3);
      });

      await waitFor(() => {
        const [{ data }] = result.current;

        expect(data).toBe("TEST_RESULT");
      });

      expect(onDone.mock.calls.length).toBe(1);
      expect(onDone.mock.calls.at(0)).toStrictEqual([
        "TEST_RESULT",
        {
          args: [1, 2, 3],
        },
      ]);
    });
    it("should call onError on failure", async () => {
      const workFn = jest.fn().mockImplementation(async () => {
        throw "TEST_RESULT";
      });
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAsync({
          fn: workFn,
          onError,
        }),
      );

      const [_bag, trigger] = result.current;

      await act(async () => {
        trigger(1, 2, 3);
      });

      await waitFor(() => {
        const [{ error }] = result.current;

        expect(error).toBe("TEST_RESULT");
      });

      expect(onError.mock.calls.length).toBe(1);
      expect(onError.mock.calls.at(0)).toStrictEqual([
        "TEST_RESULT",
        {
          args: [1, 2, 3],
        },
      ]);
    });
  });
});
