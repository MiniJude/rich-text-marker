import { HTMLAttributes } from "vue"

export type DataSetString = `data-${string}`

export interface JSONContent {
    type: string
    attributes?: HTMLAttributes & Record<DataSetString, string>
    content: any
    parent: JSONContent
    index: number
}

export async function HTMLParser(element: Element | string): Promise<JSONContent> {
    return await new Promise((resolve, reject) => {
        try {
            const treeObject: any = {};
            let elementToParse: Element;

            // If string convert to document Node
            if (typeof element === 'string') {
                const parser = new DOMParser();
                const docNode = parser.parseFromString(element, 'text/html');
                if (docNode.firstChild) {
                    elementToParse = docNode.firstChild as Element;
                }
            } else {
                elementToParse = element;
            }

            // Recursively loop through DOM elements and assign properties to object
            const treeHTML = (element: Element, object = treeObject, parent: any = {}, index: number = 0): void => {
                object.index = index
                object.type = element.nodeName.toLocaleLowerCase();
                object.parent = parent;
                const nodeList = element.childNodes;
                if (nodeList !== null) {
                    object.content = [];
                    if (nodeList.length) {
                        for (let i = 0; i < nodeList.length; i++) {
                            if (nodeList[i].nodeType === 3) {
                                object.content.push()
                                if (nodeList[i].nodeValue) {
                                    object.content.push({
                                        type: 'text',
                                        content: nodeList[i].nodeValue,
                                        attributes: (nodeList[i] as any).attributes,
                                        parent: object,
                                        index: i
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
                if (element.attributes?.hasOwnProperty('data-select_start')) {
                    try {
                        object.attributes['data-select_start'] = ''
                    } catch (error) {
                        throw new Error('该节点理论上不应该有data-select_start属性')
                    }
                }
                if (element.attributes?.hasOwnProperty('data-select_end')) {
                    try {
                        object.attributes['data-select_end'] = ''
                    } catch (error) {
                        throw new Error('该节点理论上不应该有data-select_end属性')
                    }
                }
            };

            // @ts-expect-error
            treeHTML(elementToParse);
            if (typeof element === 'string') {
                resolve(treeObject.content[1]);
            } else {
                resolve(treeObject);
            }
        } catch (e) {
            reject(e);
            console.log(e)
        }
    });
}

export async function JSONToHTML(
    content: JSONContent | string,
    string = true, // default to returning a string representation
): Promise<string | Document> {
    return await new Promise((resolve, reject) => {
        try {
            let jsonContent = content;

            // If input is a string, parse it as JSON
            if (typeof content === 'string') {
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
                html += '>';

                // If there is content, process it and add it to the tag
                if (content.content) {
                    if (Array.isArray(content.content)) {
                        content.content.forEach((node) => {
                            if (node.type === 'text') {
                                html += node.content;
                            } else {
                                html += treeJSON(node);
                            }
                        });
                    }
                }

                // End the tag
                if (content.type !== 'br') html += `</${content.type}>`;

                return html;
            };

            // Convert the JSON content to HTML string
            const html = treeJSON(jsonContent as JSONContent);

            // If string flag is set, return the HTML string
            if (string) {
                resolve(html);
            } else {
                // Otherwise, parse the HTML string to an Element
                const parser = new DOMParser();
                resolve(parser.parseFromString(html, 'text/xml'));
            }
        } catch (e) {
            // Reject the Promise if there's an error
            reject(e);
        }
    });
}