export function humanString(string) {
    let parts = string.split(/[-_]/);
    parts = parts.map((part)=>{
        return part.slice(0,1).toUpperCase() + part.slice(1, part.length + 1)
    });
    return parts.join(' ');
}
