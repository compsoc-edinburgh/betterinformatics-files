import { Link } from "react-router-dom";
import * as React from "react";
import { useState } from "react";
import { Button, Card, Flex, Title } from "@mantine/core";

export class TOCNode {
  name: string;
  jumpTarget: string;
  children: TOCNode[];
  childMap: Map<string, TOCNode>;
  constructor(name: string, jumpTarget: string) {
    this.name = name;
    this.jumpTarget = jumpTarget;
    this.children = [];
    this.childMap = new Map();
  }
  public addChild(newChild: TOCNode) {
    this.children.push(newChild);
    this.childMap.set(newChild.name, newChild);
  }
  public add(rest: string[], jumpTarget: string) {
    if (rest.length === 0) return;
    const child = this.childMap.get(rest[0]);
    if (child !== undefined) {
      child.add(rest.slice(1), jumpTarget);
    } else {
      const newToc = new TOCNode(rest[0], jumpTarget);
      this.addChild(newToc);
      newToc.add(rest.slice(1), jumpTarget);
    }
  }
}

interface NodeCompoennt {
  node: TOCNode;
}
const TOCNodeComponent: React.FC<NodeCompoennt> = ({ node }) => {
  return (
    <li>
      <Link to={`#${node.jumpTarget}`} className="text-muted">
        {node.name}
      </Link>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child, i) => (
            <TOCNodeComponent node={child} key={child.name + i} />
          ))}
        </ul>
      )}
    </li>
  );
};

interface Props {
  toc: TOCNode;
}
export const TOC: React.FC<Props> = ({ toc }) => {
  const [visible, setVisible] = useState(false);
  return visible ? (
    <Card my="xs" shadow="md">
      <Flex justify="space-between" align="center">
        <Title order={4}>Contents</Title>
        <Button onClick={() => setVisible(false)}>Hide</Button>
      </Flex>
      <ul>
        {toc.children.map((child, i) => (
          <TOCNodeComponent node={child} key={child.name + i} />
        ))}
      </ul>
    </Card>
  ) : (
    <Card my="xs" shadow="sm">
      <Flex justify="space-between" align="center">
        <Title order={4}>Contents</Title>
        <Button onClick={() => setVisible(true)}>Show</Button>
      </Flex>
    </Card>
  );
};
