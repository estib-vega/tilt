import Markdown from "react-markdown";

interface MDProps {
  content: string;
}

const MD = ({ content }: MDProps): JSX.Element => {
  return (
    <Markdown
      components={{
        h1: ({ children }) => (
          <h1 className="font-bold text-2xl mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="font-bold text-1xl mb-2">{children}</h2>
        ),
        p: ({ children }) => (
          <p className="font-normal text-sm lg:text-md mb-2">{children}</p>
        ),
        ol: ({ children }) => <ol className="list-decimal ml-4">{children}</ol>,
        li: ({ children }) => (
          <li className="font-normal text-sm lg:text-md mb-2">{children}</li>
        ),
        a: ({ children, href }) => (
          <a
            className="italic text-blue-500 hover:underline visited:text-purple-600"
            href={href}
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="font-mono text-sm bg-gray-200 p-1 rounded-md">
            {children}
          </code>
        ),
        br: () => <br />,
      }}
    >
      {content}
    </Markdown>
  );
};

MD.displayName = "MD";

export default MD;
