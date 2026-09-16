import {
    useEffect,
    useRef
} from "react";


type Props = {
    open: boolean;
    instanceName: string;
    onClose: () => void;
};


export default function MinecraftConsole({
    open,
    instanceName,
    onClose
}: Props) {

    const onCloseRef =
        useRef(onClose);

    onCloseRef.current =
        onClose;


    useEffect(() => {

        if (!open) {
            return;
        }

        void window.novex.minecraft.openConsole(
            instanceName
        );


        return () => {

            void window.novex.minecraft.closeConsole();

        };

    }, [
        open,
        instanceName
    ]);


    useEffect(() => {

        if (!open) {
            return;
        }

        const cleanup =
            window.novex.minecraft.onConsoleClosed(
                () =>
                    onCloseRef.current()
            );

        return cleanup;

    }, [open]);


    return null;
}