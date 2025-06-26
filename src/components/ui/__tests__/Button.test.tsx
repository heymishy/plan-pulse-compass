import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import { Button } from "../button";

describe("Button", () => {
  it("renders button with default variant", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("inline-flex", "items-center", "justify-center");
  });

  it("renders button with different variants", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);

    let button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole("button", { name: "Outline" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("border", "border-input", "bg-background");

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole("button", { name: "Secondary" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");

    rerender(<Button variant="ghost">Ghost</Button>);
    button = screen.getByRole("button", { name: "Ghost" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(
      "hover:bg-accent",
      "hover:text-accent-foreground"
    );

    rerender(<Button variant="link">Link</Button>);
    button = screen.getByRole("button", { name: "Link" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("text-primary", "underline-offset-4");
  });

  it("renders button with different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);

    let button = screen.getByRole("button", { name: "Small" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-9", "px-3");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button", { name: "Large" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-11", "px-8");

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole("button", { name: "Icon" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-10", "w-10");
  });

  it("applies disabled state", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:pointer-events-none",
      "disabled:opacity-50"
    );
  });

  it("renders as a link when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
