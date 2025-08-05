
export async function convertToLossy(api_base_url, wavData, targetFormat) {
    if (!wavData) {
        throw new TypeError("wavData is undefined");
    }
    const url = api_base_url + "/convert/" + targetFormat;
    const args = {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: wavData
    }
    const response = await fetch(url, args);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}