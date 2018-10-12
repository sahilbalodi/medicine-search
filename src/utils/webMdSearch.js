const axios = require('axios');
const htmlparser = require('htmlparser');



const lookForExactMatch = (name, attributes) => {
    if (attributes && attributes.class) {
        if ((name === 'ul') && (attributes.class === 'exact-match')) {
            return true;
        }
    }
    return false;
};

const lookForUses = (firstChildName, value) => {
    return (firstChildName === 'h2') && (value === 'Uses')
}

const domParser = (dom, condition) => {
    if (!dom.children) {
        return '';
    }

    if (lookForExactMatch(dom.name, dom.attribs)) {
        return {
            type: 1,
            url: dom.children[1].children[0].attribs['href']
        };
    };

    if (dom.children && dom.attribs) {
        if ((dom.name === 'div') && (dom.attribs.class === 'inner-content')) {
            console.log(dom.children[1]);
        }
        if (lookForUses(dom.children[0].name, dom.children[0].value)) {
            console.log('Found!', dom.children[1]);
            return {
                type: 3,
                uses: 'uses'
            }
        }
    }

    for (let i = 0; i < dom.children.length; i += 1) {
        let result = domParser(dom.children[i], condition);
        if (result.type) {
            return result;
        }
    }
    return '';
}



const handler = new htmlparser.DefaultHandler(async (error, dom) => {
    const baseUrl = 'https://www.webmd.com';
    if (error)
        console.log(error);
    else {
        for (let i = 0; i < dom.length; i += 1) {
            let result = domParser(dom[i]);
            if (result && result.type) {
                switch (result.type) {
                    case 1:
                        let secondSourceCode = await axios.get(baseUrl + result.url);
                        let uses = secondPageParser.parseComplete(secondSourceCode['data']);
                        console.log('uses', uses);
                        return uses;
                }
            }
        }
    }
    return '';

});

const secondPageHandler = new htmlparser.DefaultHandler((error, dom) => {
    const baseUrl = 'https://www.webmd.com';

    if (error)
        console.log(error);
    else {
        for (let i = 0; i < dom.length; i += 1) {
            // console.log(dom[i]);
            let result = domParser(dom[i]);
            if (result && result.type) {
                return result;
            }
        }
    }
    return '';

});

var parser = new htmlparser.Parser(handler);
var secondPageParser = new htmlparser.Parser(secondPageHandler);


const buildURL = (line) => {
    const array = line.split(' ').filter(word => word.length > 0);
    let url = 'https://www.webmd.com/drugs/2/search?type=drugs&query=';
    array.forEach((searchTerm) => {
        url = `${url}${searchTerm}%20`;
    });
    // return url.slice(0, url.length - 3);
    return 'https://www.webmd.com/drugs/2/search?type=drugs&query=aspirin';
};



module.exports = async (line) => {
    const url = buildURL(line);

    let sourceCode = await axios.get(url);
    let result = parser.parseComplete(sourceCode['data']);
    console.log(result)

};
