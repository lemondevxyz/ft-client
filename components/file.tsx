import { Progress, ProgressBar } from './progress';
import { FsOsFileInfo } from '../api/fs'

export interface FileProps {
    Text: string,
    Bar: ProgressBar,
}

export function FileComponent(f : FileProps) {
    return <div>
        {Progress(f.Bar)}
    </div>
}
