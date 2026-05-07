import { Component } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return _jsxs("div", {
        style: { padding: 40, textAlign: "center" },
        children: [
          _jsx("h2", { children: "Something went wrong" }),
          _jsx("p", { children: this.state.error?.message }),
          _jsx("button", {
            type: "button",
            onClick: () => this.setState({ hasError: false, error: null }),
            children: "Try Again",
          }),
        ],
      });
    }
    return this.props.children;
  }
}
