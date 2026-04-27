from __future__ import annotations

import asyncio
import uuid
from typing import Any

from models.schemas import PipelineEvent
from services.analysis_service import AnalysisService
from services.image_service import ImageService
from services.instagram_service import InstagramService
from websocket.connection_manager import ConnectionManager


class PipelineService:
    def __init__(self, manager: ConnectionManager) -> None:
        self.manager = manager
        self.instagram = InstagramService()
        self.analysis = AnalysisService()
        self.image = ImageService()

    def start_profile_analysis(self, username: str, posts_limit: int = 12) -> str:
        process_id = str(uuid.uuid4())
        asyncio.create_task(self._run_pipeline(process_id, username, posts_limit))
        return process_id

    async def _emit(
        self,
        process_id: str,
        step: str,
        progress: int,
        message: str,
        image: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> None:
        await self.manager.broadcast(
            process_id,
            PipelineEvent(step=step, progress=progress, message=message, image=image, data=data),
        )

    async def _run_pipeline(self, process_id: str, username: str, posts_limit: int) -> None:
        try:
            await self._emit(process_id, "starting", 1, "Iniciando análisis...")
            await asyncio.sleep(0.3)

            await self._emit(process_id, "metadata", 10, "Obteniendo metadata del perfil...")
            metadata = await self.instagram.get_profile_metadata(username)
            await asyncio.sleep(0.4)

            await self._emit(process_id, "downloading_posts", 25, "Descargando publicaciones recientes...")
            posts = await self.instagram.get_recent_posts(username, posts_limit)
            await asyncio.sleep(0.6)

            await self._emit(process_id, "analyzing_text", 40, "Analizando captions y hashtags...")
            metrics = self.analysis.analyze(metadata, posts)
            await asyncio.sleep(0.5)

            await self._emit(
                process_id,
                "calculating_metrics",
                50,
                "Calculando métricas del perfil...",
                data={"metadata": metadata, "metrics": metrics},
            )
            await asyncio.sleep(0.5)

            canvas = self.image.start_canvas()

            canvas = self.image.batch_background(canvas, metrics)
            await self._emit(
                process_id,
                "batch_background",
                60,
                "Batch 1/5: construyendo fondo...",
                image=self.image.to_base64(canvas),
            )
            await asyncio.sleep(0.7)

            canvas, center, main_radius = self.image.batch_main_node(canvas, metrics)
            await self._emit(
                process_id,
                "batch_main_node",
                70,
                "Batch 2/5: dibujando nodo principal...",
                image=self.image.to_base64(canvas),
            )
            await asyncio.sleep(0.7)

            canvas, nodes = self.image.batch_hashtag_nodes(canvas, metrics, center, main_radius)
            await self._emit(
                process_id,
                "batch_hashtag_nodes",
                80,
                "Batch 3/5: añadiendo nodos de hashtags...",
                image=self.image.to_base64(canvas),
            )
            await asyncio.sleep(0.7)

            canvas = self.image.batch_connections(canvas, center, nodes)
            await self._emit(
                process_id,
                "batch_connections",
                90,
                "Batch 4/5: conectando relaciones...",
                image=self.image.to_base64(canvas),
            )
            await asyncio.sleep(0.7)

            canvas = self.image.batch_details(canvas, metrics)
            await self._emit(
                process_id,
                "batch_details",
                98,
                "Batch 5/5: aplicando detalles finales...",
                image=self.image.to_base64(canvas),
            )
            await asyncio.sleep(0.5)

            await self._emit(
                process_id,
                "completed",
                100,
                "Análisis e imagen final completados.",
                image=self.image.to_base64(canvas),
                data={"metadata": metadata, "metrics": metrics, "posts_analyzed": len(posts)},
            )

        except Exception as exc:
            await self._emit(
                process_id,
                "error",
                100,
                f"Error durante el proceso: {exc}",
            )
        finally:
            await asyncio.sleep(60)
            await self.manager.cleanup(process_id)
