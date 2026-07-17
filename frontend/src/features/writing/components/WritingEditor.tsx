import { TextField } from "@mui/material";

interface Props {

    value: string;

    onChange: (value: string) => void;

}

export default function WritingEditor({

                                          value,

                                          onChange,

                                      }: Props) {

    return (

        <TextField

            multiline

            fullWidth

            minRows={8}

            placeholder="Nhập câu trả lời bằng tiếng Nhật..."

            value={value}

            onChange={(e) =>
                onChange(e.target.value)
            }

        />

    );

}