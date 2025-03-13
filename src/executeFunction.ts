type LeafFunc = () => any;

function executeFunction(leafFunc: LeafFunc): any {
    const potValue = leafFunc();
    return potValue;
}