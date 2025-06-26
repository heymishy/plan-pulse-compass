import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import { Input } from "../input";

describe("Input", () => {
  it("renders input with default props", () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("flex", "h-10", "w-full");
  });

  it("renders input with different types", () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />);

    let input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("type", "email");

    rerender(<Input type="password" placeholder="Password" />);
    input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");

    rerender(<Input type="number" placeholder="Number" />);
    input = screen.getByPlaceholderText("Number");
    expect(input).toHaveAttribute("type", "number");
  });

  it("applies disabled state", () => {
    render(<Input disabled placeholder="Disabled input" />);

    const input = screen.getByPlaceholderText("Disabled input");
    expect(input).toBeDisabled();
    expect(input).toHaveClass(
      "disabled:cursor-not-allowed",
      "disabled:opacity-50"
    );
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Input ref={ref} placeholder="Ref input" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles value changes", () => {
    render(<Input placeholder="Test input" defaultValue="initial value" />);

    const input = screen.getByPlaceholderText("Test input");
    expect(input).toHaveValue("initial value");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" placeholder="Custom input" />);

    const input = screen.getByPlaceholderText("Custom input");
    expect(input).toHaveClass("custom-class");
  });

  it("renders with aria attributes", () => {
    render(
      <Input
        aria-label="Username"
        aria-describedby="username-help"
        placeholder="Enter username"
      />
    );

    const input = screen.getByLabelText("Username");
    expect(input).toHaveAttribute("aria-describedby", "username-help");
  });
});
