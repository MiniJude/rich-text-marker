export interface JSONContent {
    type: string;
    attributes?: any;
    _tags?: string[];
    content: any;
    parent: JSONContent;
    index: number;
}

export function htmlToJson(element: Element | string): JSONContent {
    const treeObject: any = {};
    let elementToParse: Element;

    // If string convert to document Node
    if (typeof element === "string") {
        const parser = new DOMParser();
        const docNode = parser.parseFromString(element, "text/html");
        if (docNode.firstChild) {
            elementToParse = docNode.firstChild as Element;
        }
    } else {
        elementToParse = element;
    }

    // Recursively loop through DOM elements and assign properties to object
    const treeHTML = (element: Element, object = treeObject, parent: any = {}, index: number = 0): void => {
        object.index = index;
        object.type = element.nodeName.toLocaleLowerCase();
        object.parent = parent;
        object._tags = element._tags;
        const nodeList = element.childNodes;
        if (nodeList !== null) {
            object.content = [];
            if (nodeList.length) {
                for (let i = 0; i < nodeList.length; i++) {
                    if (nodeList[i].nodeType === 3) {
                        if (nodeList[i].nodeValue) {
                            object.content.push({
                                type: "text",
                                content: nodeList[i].nodeValue,
                                attributes: (nodeList[i] as any).attributes,
                                parent: object,
                                _tags: (nodeList[i] as any)._tags,
                                index: i,
                            });
                        }
                    } else {
                        object.content.push({});
                        treeHTML(nodeList[i] as Element, object.content[object.content.length - 1], object, i);
                    }
                }
            }
        }
        if (element.attributes?.length) {
            object.attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
                object.attributes[element.attributes[i].nodeName] = element.attributes[i].nodeValue;
            }
        }
    };

    // @ts-expect-error
    treeHTML(elementToParse);
    if (typeof element === "string") {
        return treeObject.content[1];
    } else {
        return treeObject;
    }
}

export function JsonToHtml(
    content: JSONContent | string,
    string = true // default to returning a string representation
): string | Document {
    let jsonContent = content;

    // If input is a string, parse it as JSON
    if (typeof content === "string") {
        jsonContent = JSON.parse(content) as JSONContent;
    }

    // Recursively construct HTML string from JSON content
    const treeJSON = (content: JSONContent): string => {
        let html = `<${content.type}`; // Start with opening tag

        // If there are attributes, add them to the tag
        if (content.attributes) {
            Object.entries(content.attributes).forEach(([attribute, value]) => {
                html += ` ${attribute}="${value as string}"`;
            });
        }
        html += ">";

        // If there is content, process it and add it to the tag
        if (content.content) {
            if (Array.isArray(content.content)) {
                content.content.forEach((node) => {
                    if (node.type === "text") {
                        html += node.content;
                    } else {
                        html += treeJSON(node);
                    }
                });
            }
        }

        // End the tag
        if (content.type !== "br") html += `</${content.type}>`;

        return html;
    };

    // Convert the JSON content to HTML string
    const html = treeJSON(jsonContent as JSONContent);

    // If string flag is set, return the HTML string
    if (string) {
        return html;
    } else {
        // Otherwise, parse the HTML string to an Element
        const parser = new DOMParser();
        return parser.parseFromString(html, "text/xml");
    }
}
