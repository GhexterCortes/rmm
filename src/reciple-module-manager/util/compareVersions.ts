export default (version1: string, version2: string): boolean => {
    if (version1.trim() === version2.trim()) return true;

    const v1 = version1.split('.').map(v => parseInt(v));
    const v2 = version2.split('.').map(v => parseInt(v));

    if (v1[0] > v2[0]) return true;
    if (v1[0] < v2[0]) return false;

    if (v1[1] > v2[1]) return true;
    if (v1[1] < v2[1]) return false;

    if (v1[2] > v2[2]) return true;
    if (v1[2] < v2[2]) return false;

    return false;
}