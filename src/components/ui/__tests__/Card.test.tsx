import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

describe("Card", () => {
  it("renders card with basic content", () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
    expect(screen.getByText("Card content").closest("div")).toHaveClass(
      "rounded-lg",
      "border"
    );
  });

  it("renders card with header", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Description")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders card with footer", () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
    expect(screen.getByText("Card footer")).toBeInTheDocument();
  });

  it("renders complete card structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a complete card</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );

    expect(screen.getByText("Complete Card")).toBeInTheDocument();
    expect(screen.getByText("This is a complete card")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Card className="custom-card">
        <CardContent>Custom card</CardContent>
      </Card>
    );

    const card = screen.getByText("Custom card").closest("div");
    expect(card).toHaveClass("custom-card");
  });
});
