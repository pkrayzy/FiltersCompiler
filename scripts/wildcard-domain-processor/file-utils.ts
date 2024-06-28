import { promises as fs } from 'fs';
import path from 'path';

/**
 * Reads the content of a file at a given path.
 * @param filePath - The path to the file to be read.
 * @returns A promise that resolves to the content of the file as a string.
 * @throws Will throw an error if the file cannot be read.
 */
export const readFile = async (filePath: string): Promise<string> => {
    return fs.readFile(filePath, 'utf8');
};

/**
 * Writes content to a file at a given path. If the file does not exist, it will be created.
 * @param filePath - The path to the file where the content will be written.
 * @param content - The content to write to the file.
 * @returns A promise that resolves when the file has been written.
 * @throws Will throw an error if the file cannot be written.
 */
export const writeFile = async (filePath: string, content: string): Promise<void> => {
    await fs.writeFile(path.resolve(__dirname, filePath), content, 'utf8');
};
