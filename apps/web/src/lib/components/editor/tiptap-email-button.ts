import { Node, mergeAttributes } from "@tiptap/core";

export type EmailButtonOptions = {
  /** Extra HTML attributes added to every rendered node. */
  HTMLAttributes: Record<string, string>;
};

export type EmailButtonAttrs = {
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emailButton: {
      /** Insert an email CTA button at the current cursor position. */
      insertEmailButton: (attrs: EmailButtonAttrs) => ReturnType;
      /** Update the attributes of the currently selected email button. */
      updateEmailButton: (attrs: Partial<EmailButtonAttrs>) => ReturnType;
    };
  }
}

/**
 * Default inline styles for the email button `<a>` tag.
 * Uses inline styles exclusively for email client compatibility.
 */
function buildEmailButtonStyles(
  backgroundColor: string,
  textColor: string
): string {
  return [
    `display: inline-block`,
    `padding: 12px 24px`,
    `background-color: ${backgroundColor}`,
    `color: ${textColor}`,
    `text-decoration: none`,
    `font-weight: 700`,
    `font-size: 14px`,
    `text-transform: uppercase`,
    `letter-spacing: 0.05em`,
    `border: 2px solid ${backgroundColor}`,
    `text-align: center`,
  ].join("; ");
}

/**
 * A TipTap node representing an email CTA button.
 *
 * - Block-level node (renders as a centered `<div>` wrapper with an `<a>` inside).
 * - Stores text, url, backgroundColor, textColor as attributes.
 * - Renders in the editor as a styled button preview.
 * - Serializes to email-compatible HTML with inline styles (no CSS classes).
 * - Parses matching `<a>` tags from incoming HTML back into button nodes.
 */
export const EmailButton = Node.create<EmailButtonOptions>({
  name: "emailButton",

  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      text: {
        default: "Click Here",
        parseHTML: (element) => {
          const anchor = element.querySelector("a") ?? element;
          return anchor.textContent?.trim() ?? "Click Here";
        },
      },
      url: {
        default: "#",
        parseHTML: (element) => {
          const anchor = element.querySelector("a") ?? element;
          return anchor.getAttribute("href") ?? "#";
        },
      },
      backgroundColor: {
        default: "#c4520a",
        parseHTML: (element) => {
          const anchor = element.querySelector("a") ?? element;
          const style = anchor.getAttribute("style") ?? "";
          const match = style.match(/background-color:\s*([^;]+)/);
          return match?.[1]?.trim() ?? "#c4520a";
        },
      },
      textColor: {
        default: "#ffffff",
        parseHTML: (element) => {
          const anchor = element.querySelector("a") ?? element;
          const style = anchor.getAttribute("style") ?? "";
          // Match "color:" that is NOT "background-color:"
          const match = style.match(/(?<!background-)color:\s*([^;]+)/);
          return match?.[1]?.trim() ?? "#ffffff";
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="email-button"]',
      },
      {
        // Parse email-style button links (div > a with inline styles containing display: inline-block)
        tag: "div",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const anchor = element.querySelector("a");
          if (!anchor) return false;
          const style = anchor.getAttribute("style") ?? "";
          if (!style.includes("display: inline-block")) return false;
          if (!style.includes("background-color")) return false;
          return null;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { text, url, backgroundColor, textColor } =
      node.attrs as EmailButtonAttrs;
    const buttonStyle = buildEmailButtonStyles(backgroundColor, textColor);

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "email-button",
        style: "text-align: center; padding: 16px 0;",
      }),
      [
        "a",
        {
          href: url,
          style: buttonStyle,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        text,
      ],
    ];
  },

  addCommands() {
    return {
      insertEmailButton:
        (attrs: EmailButtonAttrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
      updateEmailButton:
        (attrs: Partial<EmailButtonAttrs>) =>
        ({ commands, state }) => {
          const { from } = state.selection;
          const node = state.doc.nodeAt(from);
          if (node?.type.name !== this.name) return false;
          return commands.updateAttributes(this.name, attrs);
        },
    };
  },
});
