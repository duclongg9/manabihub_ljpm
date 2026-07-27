package com.manabihub.order.repository;

import com.manabihub.order.entity.OrderItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    @EntityGraph(attributePaths = {"course", "course.teacher"})
    List<OrderItem> findByOrder_Id(UUID orderId);

    @EntityGraph(attributePaths = {"order", "course", "course.teacher"})
    List<OrderItem> findByOrder_IdIn(Collection<UUID> orderIds);
}
