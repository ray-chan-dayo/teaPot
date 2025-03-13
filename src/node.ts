export function isVariable(l:Prototype | undefined):l is Variable {
    return l !== undefined && l.type === "variable";
}