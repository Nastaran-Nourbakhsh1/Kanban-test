import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "../src/components/board";
describe("board interactions", () => {
  it("validates a card, accepts multiline details and restores dialog focus", async () => {
    const user = userEvent.setup();
    render(<Board />);
    const add = within(
      screen.getByRole("region", { name: "ایده‌ها" }),
    ).getByRole("button", { name: "افزودن کارت" });
    await user.click(add);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/عنوان کارت/)).toHaveFocus();
    await user.click(
      within(dialog).getByRole("button", { name: "افزودن کارت" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "عنوان کارت را وارد کنید.",
    );
    await user.type(
      within(dialog).getByLabelText(/عنوان کارت/),
      "کارت آزمایشی",
    );
    await user.type(
      within(dialog).getByLabelText(/جزئیات/),
      "خط اول{enter}خط دوم",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "افزودن کارت" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "کارت آزمایشی" }),
    ).toBeInTheDocument();
    expect(add).toHaveFocus();
  });
  it("cancels creation, clears the form on reopening, and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<Board />);
    const add = screen.getAllByRole("button", { name: "افزودن کارت" })[0];
    await user.click(add);
    await user.type(screen.getByLabelText(/عنوان کارت/), "لغو");
    await user.click(screen.getByRole("button", { name: "انصراف" }));
    expect(
      screen.queryByRole("heading", { name: "لغو" }),
    ).not.toBeInTheDocument();
    await user.click(add);
    expect(screen.getByLabelText(/عنوان کارت/)).toHaveValue("");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("saves renames with Enter or blur, cancels with Escape and rejects whitespace", async () => {
    const user = userEvent.setup();
    render(<Board />);
    await user.click(screen.getByRole("button", { name: "تغییر نام ایده‌ها" }));
    await user.clear(screen.getByRole("textbox", { name: "نام ستون" }));
    await user.type(
      screen.getByRole("textbox", { name: "نام ستون" }),
      "جدید{Enter}",
    );
    await user.click(screen.getByRole("button", { name: "تغییر نام جدید" }));
    await user.type(
      screen.getByRole("textbox", { name: "نام ستون" }),
      "لغو{Escape}",
    );
    expect(
      screen.getByRole("button", { name: "تغییر نام جدید" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "تغییر نام جدید" }));
    await user.clear(screen.getByRole("textbox", { name: "نام ستون" }));
    await user.type(screen.getByRole("textbox", { name: "نام ستون" }), "   ");
    await user.tab();
    expect(
      screen.getByRole("button", { name: "تغییر نام جدید" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "تغییر نام جدید" }));
    await user.clear(screen.getByRole("textbox", { name: "نام ستون" }));
    await user.type(
      screen.getByRole("textbox", { name: "نام ستون" }),
      "ذخیره با خروج",
    );
    await user.tab();
    expect(
      screen.getByRole("button", { name: "تغییر نام ذخیره با خروج" }),
    ).toBeInTheDocument();
  });
  it("requires confirmation to delete and supports cancellation", async () => {
    const user = userEvent.setup();
    render(<Board />);
    const title = "تجربه‌ای ساده‌تر برای شروع";
    await user.click(screen.getByRole("button", { name: `حذف ${title}` }));
    await user.click(screen.getByRole("button", { name: "انصراف" }));
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: `حذف ${title}` }));
    await user.click(screen.getByRole("button", { name: "حذف کارت" }));
    expect(
      screen.queryByRole("heading", { name: title }),
    ).not.toBeInTheDocument();
  });
});
