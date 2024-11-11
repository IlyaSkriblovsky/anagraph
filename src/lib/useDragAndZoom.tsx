import { useEffect } from "react";
import { noop, SafeDictionary } from "ts-essentials";

import { Bounds } from "./basic-types";

interface TouchDetails {
    originX: number;
    currentX: number;
}

function iterateTouchList(touchList: TouchList, iterator: (touch: Touch) => void): void {
    for (let i = 0; i < touchList.length; i++) {
        iterator(touchList[i]);
    }
}

const wheelZoomFactor = 1.5;

interface DragAndZoomOptions {
    boundsLimit?: Bounds;
    xMinVisible?: number;
}

export function fitBoundsInLimit(bounds: Bounds, limit: Bounds | undefined): Bounds {
    if (limit == null) {
        return bounds;
    }

    if (bounds[0] < limit[0]) {
        return [limit[0], Math.min(limit[1], bounds[1] + (limit[0] - bounds[0]))];
    }

    if (bounds[1] > limit[1]) {
        return [Math.max(limit[0], bounds[0] - (bounds[1] - limit[1])), limit[1]];
    }

    return bounds;
}

export function fitBoundsInMinVisibleX (newBounds: Bounds, oldBounds: Bounds, minVisibleX: number | undefined): Bounds {
    if (minVisibleX == null) {
        minVisibleX = 1;
    }

    if (newBounds[1] - newBounds[0] > minVisibleX) {
        return newBounds;
    }

    const center = (oldBounds[0] + oldBounds[1]) / 2;

    return [
        center - minVisibleX / 2,
        center + minVisibleX / 2
    ];
}

/** @function useDragAndZoom
 *
 * Обработчик манипуляций горизонтального драга и зума над HTML-элементом.
 * Поддерживает таскание мышью и пальцем, двухпальцевый зум, зум колесом мыши, а также тачпадом.
 *
 * В параметр viewport передаётся отрезок, соответствующий элементу element. В коллбэки
 * будет передан отрезок, соответствующий той же области экрана, но после манипуляции.
 *
 * Важно чтобы во время манипуляции параметры этой функции не изменялись. Изменение параметров
 * приведёт к сбросу текущей манипуляции. Чтобы это обеспечить, не записывайте то, что получите
 * в onChange во viewport сразу, а используйте промежуточный стейт. При вызове onEnd полученные
 * значения уже можно записывать сразу во viewport.
 *
 * Эту особенность можно было бы обработать и внутри useDragAndZoom, чтобы не затруднять
 * вызывающего. Но весьма вероятно, что вызывающий всё равно захочет разделить коллбэки,
 * вызываемые в процессе манипуляции и в её конце, чтобы отложить какую-то работу на завершение
 * манипуляции. Скажем, если речь о графиках, лучше не пересчитывать статистику на каждое движение
 * пальцев пользователя, а сделать это когда он отпустил график. А раз так, вызывающему всё равно
 * придётся разделить временный, локальный viewport, существующий только в процессе манипуляции,
 * и финальный, устанавливаемый при её завершении. А раз так, мы не сможем облегчить задачу
 * вызывающему, спрятав временный viewport внутри этой функции, и не будем этим заниматься.
 *
 * @param element   Элемент, на котором обрабатываются события
 * @param viewport  Отрезок на некоей шкале, соответствующий элементу element
 * @param onChange  Коллбэк, который будет вызываться в процессе манипуляций
 * @param onEnd     Коллбэк, который вызовется при завершении манипуляции
 * @param onHover   Коллбэк, который вызовется при движении курсора без нажатия
 * @param onHoverEnd Коллбэк, который вызовется при завершении движения курсора без нажатия
 * @param options   Дополнительные параметры
 */
export function useDragAndZoom(
    element: HTMLElement | null,
    viewport: Bounds,
    onChange: (viewport: Bounds) => void,
    onEnd: (viewport: Bounds) => void,
    onHover?: (x: number, event: PointerEvent) => void,
    onHoverEnd?: () => void,
    onTouchUp?: (x: number, event: PointerEvent) => void,
    options: DragAndZoomOptions = {},
): void {
    // FIXME: возможно можно избежать лишних rebind'ов если хранить viewport
    //        в Ref'е. Он ведь нужен только в момент первого нажатия, кажется
    //        что сбрасывать весь эффект ради этого нет смысла.

    useEffect(() => {
        if (!element) return noop;

        const touchInfo: SafeDictionary<TouchDetails, number | string> = {};
        let temporaryViewport: Bounds = viewport;

        let startX: number, startY: number;

        function calcXInTemporaryViewport(pageX: number, bounds: DOMRect): number {
            return (
                ((pageX - bounds.left) / bounds.width) * (temporaryViewport[1] - temporaryViewport[0]) +
                temporaryViewport[0]
            );
        }

        const updateTemporaryViewport = (): void => {
            const touchIds = Object.keys(touchInfo);
            const touchesCount = touchIds.length;

            if (touchesCount == 1) {
                const touch = touchInfo[touchIds[0]];

                if (touch != null) {
                    const vpDiff = touch.currentX - touch.originX;
                    temporaryViewport = [temporaryViewport[0] - vpDiff, temporaryViewport[1] - vpDiff];
                }
            } else if (touchesCount == 2) {
                const touch1 = touchInfo[touchIds[0]];
                const touch2 = touchInfo[touchIds[1]];

                if (touch1 != null && touch2 != null) {
                    const prev1 = Math.min(touch1.originX, touch2.originX);
                    const prev2 = Math.max(touch1.originX, touch2.originX);
                    const new1 = Math.min(touch1.currentX, touch2.currentX);
                    const new2 = Math.max(touch1.currentX, touch2.currentX);

                    const k = (prev1 - prev2) / (new1 - new2);
                    const b = prev1 - k * new1;

                    const newViewport: Bounds = [k * temporaryViewport[0] + b, k * temporaryViewport[1] + b]


                    temporaryViewport = fitBoundsInMinVisibleX(newViewport, temporaryViewport, options.xMinVisible)

                }
            }

            temporaryViewport = fitBoundsInLimit(temporaryViewport, options.boundsLimit);

            onChange(temporaryViewport);
        };

        const onTouchStart = (event: TouchEvent) => {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;

            if (Object.keys(touchInfo).length == 0) {
                temporaryViewport = viewport;
            }

            const bounds = element.getBoundingClientRect();
            iterateTouchList(event.changedTouches, (touch) => {
                touchInfo[touch.identifier] = {
                    originX: calcXInTemporaryViewport(touch.pageX, bounds),
                    currentX: calcXInTemporaryViewport(touch.pageX, bounds),
                };
            });
        };

        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType != "mouse") return;
            if (Object.keys(touchInfo).length === 0) {
                onHoverEnd?.();
            }
            temporaryViewport = viewport;
            const bounds = element.getBoundingClientRect();
            const x = calcXInTemporaryViewport(event.pageX, bounds);
            touchInfo[event.pointerId] = { originX: x, currentX: x };
            element.setPointerCapture(event.pointerId);
        };

        const onTouchEnd = (event: TouchEvent) => {
            iterateTouchList(event.changedTouches, (touch) => delete touchInfo[touch.identifier]);

            if (Object.keys(touchInfo).length == 0) {
                onEnd(temporaryViewport);
            }
        };

        const onPointerUp = (event: PointerEvent) => {
            if (event.pointerType != "mouse") {
                const bounds = element.getBoundingClientRect();
                onTouchUp?.(calcXInTemporaryViewport(event.pageX, bounds), event);
                return
            }

            delete touchInfo[event.pointerId];
            if (Object.keys(touchInfo).length == 0) {
                onEnd(temporaryViewport);
            }
            element.releasePointerCapture(event.pointerId);
        };

        const onTouchMove = (event: TouchEvent) => {
            const moveX = event.touches[0].clientX;
            const moveY = event.touches[0].clientY;

            const diffX = moveX - startX;
            const diffY = moveY - startY;

            if (Math.abs(diffX) < Math.abs(diffY) && event.touches.length === 1) return
            event.preventDefault()

            const bounds = element.getBoundingClientRect();
            iterateTouchList(event.changedTouches, (touch) => {
                const info = touchInfo[touch.identifier];
                if (info) {
                    info.currentX = calcXInTemporaryViewport(touch.pageX, bounds);
                }
            });
            updateTemporaryViewport();
        };

        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType != "mouse") return;
            const bounds = element.getBoundingClientRect();
            const info = touchInfo[event.pointerId];
            if (info) {
                info.currentX = calcXInTemporaryViewport(event.pageX, bounds);
                updateTemporaryViewport();
            } else {
                if (onHover) {
                    onHover(calcXInTemporaryViewport(event.pageX, bounds), event);
                }
            }
        };

        const onPointerOut = (event: PointerEvent) => {
            onHoverEnd?.();
        };

        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const bounds = element.getBoundingClientRect();
            const x = calcXInTemporaryViewport(event.pageX, bounds);

            const factor = Math.pow(wheelZoomFactor, event.deltaY / 53);

            const newViewPort: Bounds = [x - (x - temporaryViewport[0]) * factor, x + (temporaryViewport[1] - x) * factor]

            temporaryViewport = fitBoundsInMinVisibleX(newViewPort, temporaryViewport, options.xMinVisible)

            temporaryViewport = fitBoundsInLimit(
                temporaryViewport,
                options.boundsLimit,
            );

            onEnd(temporaryViewport);
        };

        element.addEventListener("touchstart", onTouchStart);
        element.addEventListener("touchmove", onTouchMove);
        element.addEventListener("touchend", onTouchEnd);
        element.addEventListener("wheel", onWheel);

        element.addEventListener("pointerdown", onPointerDown);
        element.addEventListener("pointerup", onPointerUp);
        element.addEventListener("pointermove", onPointerMove);
        element.addEventListener("pointerout", onPointerOut);

        return () => {
            element.removeEventListener("touchstart", onTouchStart);
            element.removeEventListener("touchmove", onTouchMove);
            element.removeEventListener("touchend", onTouchEnd);
            element.removeEventListener("wheel", onWheel);

            element.removeEventListener("pointerdown", onPointerDown);
            element.removeEventListener("pointerup", onPointerUp);
            element.removeEventListener("pointermove", onPointerMove);
            element.removeEventListener("pointerout", onPointerOut);
        };
    }, [element, onChange, onEnd, viewport[0], viewport[1], options.boundsLimit?.[0], options.boundsLimit?.[1]]);
}
